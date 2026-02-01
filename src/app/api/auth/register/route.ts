/**
 * API Route: POST /api/auth/register
 * 
 * Creates a new user account with username, email, and password.
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import db, { ensureInitialized } from '@/lib/db';
import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
} from '@/lib/auth/auth-utils';

interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    const body: RegisterBody = await request.json();
    const { username, email, password } = body;

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate username length and format
    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 30 characters' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsernameResult = await db().execute({
      sql: 'SELECT id FROM users WHERE username = ?',
      args: [username],
    });
    if (existingUsernameResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingEmailResult = await db().execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email.toLowerCase()],
    });
    if (existingEmailResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password and create user
    const userId = uuidv4();
    const passwordHash = await hashPassword(password);

    await db().execute({
      sql: `INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)`,
      args: [userId, username, email.toLowerCase(), passwordHash],
    });

    // Generate tokens
    const tokenPayload = { userId, username, email: email.toLowerCase() };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = await generateRefreshToken(userId);

    // Set cookies
    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        username,
        email: email.toLowerCase(),
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
