/**
 * Authentication utilities
 * 
 * Handles password hashing, JWT token generation/verification,
 * and session management.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import db, { ensureInitialized } from '@/lib/db';

// Secret keys - in production, these should be environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'storyboard-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'storyboard-refresh-secret-change-in-production';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// ============================================================================
// PASSWORD UTILITIES
// ============================================================================

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================================
// JWT UTILITIES
// ============================================================================

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
}

/**
 * Generate an access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generate a refresh token and store it in the database
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  await ensureInitialized();
  const sessionId = uuidv4();
  const refreshToken = jwt.sign({ sessionId, userId }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS).toISOString();

  // Store refresh token in database
  await db().execute({
    sql: `INSERT INTO sessions (id, user_id, refresh_token, expires_at) VALUES (?, ?, ?, ?)`,
    args: [sessionId, userId, refreshToken, expiresAt],
  });

  return refreshToken;
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<{ sessionId: string; userId: string } | null> {
  try {
    await ensureInitialized();
    const payload = jwt.verify(token, JWT_REFRESH_SECRET) as { sessionId: string; userId: string };
    
    // Check if session exists in database
    const result = await db().execute({
      sql: 'SELECT * FROM sessions WHERE id = ? AND refresh_token = ?',
      args: [payload.sessionId, token],
    });
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

/**
 * Invalidate a refresh token (logout)
 */
export async function invalidateRefreshToken(token: string): Promise<boolean> {
  try {
    await ensureInitialized();
    const payload = jwt.verify(token, JWT_REFRESH_SECRET) as { sessionId: string };
    await db().execute({
      sql: 'DELETE FROM sessions WHERE id = ?',
      args: [payload.sessionId],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Invalidate all refresh tokens for a user (logout everywhere)
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await ensureInitialized();
  await db().execute({
    sql: 'DELETE FROM sessions WHERE user_id = ?',
    args: [userId],
  });
}

// ============================================================================
// COOKIE UTILITIES
// ============================================================================

/**
 * Set authentication cookies
 */
export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  });

  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

/**
 * Clear authentication cookies
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
}

/**
 * Get the current user from cookies
 */
export async function getCurrentUser(): Promise<TokenPayload | null> {
  await ensureInitialized();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (accessToken) {
    const payload = verifyAccessToken(accessToken);
    if (payload) {
      return payload;
    }
  }

  // Try to refresh using refresh token
  const refreshToken = cookieStore.get('refresh_token')?.value;
  if (refreshToken) {
    const refreshPayload = await verifyRefreshToken(refreshToken);
    if (refreshPayload) {
      // Get user data
      const result = await db().execute({
        sql: 'SELECT id, username, email FROM users WHERE id = ?',
        args: [refreshPayload.userId],
      });
      const user = result.rows[0] as unknown as { id: string; username: string; email: string } | undefined;
      
      if (user) {
        // Generate new access token
        const newAccessToken = generateAccessToken({
          userId: user.id,
          username: user.username,
          email: user.email,
        });
        
        // Set new access token cookie
        const cookieStore2 = await cookies();
        cookieStore2.set('access_token', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60,
          path: '/',
        });

        return {
          userId: user.id,
          username: user.username,
          email: user.email,
        };
      }
    }
  }

  return null;
}
