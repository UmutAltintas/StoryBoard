/**
 * API Route: GET /api/auth/me
 * 
 * Returns the current authenticated user's information.
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-utils';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.userId,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Failed to check authentication' },
      { status: 500 }
    );
  }
}
