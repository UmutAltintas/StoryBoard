/**
 * API Route: POST /api/auth/login
 * 
 * Authenticates a user with email/username and password.
 */

import { NextRequest, NextResponse } from 'next/server';
import db, { ensureInitialized } from '@/lib/db';
import {
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
} from '@/lib/auth/auth-utils';

interface LoginBody {
  emailOrUsername: string;
  password: string;
}

interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
}

export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    const body: LoginBody = await request.json();
    const { emailOrUsername, password } = body;

    // Validate input
    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      );
    }

    // Find user by email or username
    const result = await db().execute({
      sql: `SELECT id, username, email, password_hash FROM users WHERE email = ? OR username = ?`,
      args: [emailOrUsername.toLowerCase(), emailOrUsername],
    });
    const user = result.rows[0] as unknown as UserRow | undefined;

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = await generateRefreshToken(user.id);

    // Set cookies
    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to log in' },
      { status: 500 }
    );
  }
}
