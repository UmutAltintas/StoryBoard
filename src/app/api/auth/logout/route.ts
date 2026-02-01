/**
 * API Route: POST /api/auth/logout
 * 
 * Logs out the current user by clearing tokens.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  invalidateRefreshToken,
  clearAuthCookies,
} from '@/lib/auth/auth-utils';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    // Invalidate refresh token in database
    if (refreshToken) {
      await invalidateRefreshToken(refreshToken);
    }

    // Clear cookies
    await clearAuthCookies();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookies even if there's an error
    await clearAuthCookies();
    return NextResponse.json({ success: true });
  }
}
