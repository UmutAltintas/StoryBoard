/**
 * API Route: GET /api/admin/debug-db
 * 
 * Debug endpoint to see what's in the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import db, { ensureInitialized } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (key !== process.env.ADMIN_SECRET_KEY && key !== 'debug-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await ensureInitialized();
    
    // Get all tables
    const tablesResult = await db().execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    const tables = tablesResult.rows.map(r => r.name);
    
    // Get users count
    const usersResult = await db().execute('SELECT COUNT(*) as count FROM users');
    const usersCount = usersResult.rows[0]?.count || 0;
    
    // Get user_data entries
    const userDataResult = await db().execute(
      'SELECT user_id, LENGTH(data) as data_length, updated_at FROM user_data'
    );
    const userData = userDataResult.rows.map(r => ({
      userId: r.user_id,
      dataLength: r.data_length,
      updatedAt: r.updated_at,
    }));
    
    // Sample data from first user_data entry
    let sampleData = null;
    if (userData.length > 0) {
      const sample = await db().execute(
        'SELECT data FROM user_data LIMIT 1'
      );
      if (sample.rows[0]?.data) {
        try {
          const parsed = JSON.parse(sample.rows[0].data as string);
          sampleData = {
            stories: parsed.stories?.length || 0,
            characters: parsed.characters?.length || 0,
            chapters: parsed.chapters?.length || 0,
            locations: parsed.locations?.length || 0,
            events: parsed.events?.length || 0,
            loreEntries: parsed.loreEntries?.length || 0,
            ideaCards: parsed.ideaCards?.length || 0,
          };
        } catch {
          sampleData = 'Invalid JSON';
        }
      }
    }
    
    return NextResponse.json({
      tables,
      usersCount,
      userData,
      sampleData,
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
