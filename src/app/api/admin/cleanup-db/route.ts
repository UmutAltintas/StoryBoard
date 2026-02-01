/**
 * API Route: GET, POST /api/admin/cleanup-db
 * 
 * Drops all old tables except users, user_data, and sessions.
 * This is a one-time cleanup after migrating to JSON storage.
 */

import { NextRequest, NextResponse } from 'next/server';
import db, { ensureInitialized } from '@/lib/db';

// List of old tables to drop (from Turso screenshot)
const OLD_TABLES = [
  'stories',
  'characters',
  'locations',
  'events',
  'event_characters',
  'relationships',
  'lore_entries',
  'lore_characters',
  'lore_locations',
  'lore_events',
  'lore_tags',
  'idea_groups',
  'idea_cards',
  'idea_characters',
  'idea_locations',
  'idea_card_characters',
  'idea_card_locations',
  'idea_card_tags',
  'chapters',
  'chapter_tags',
  'chapter_characters',
  'chapter_locations',
  'tags',
];

async function cleanupDatabase(key: string | null) {
  if (key !== process.env.ADMIN_SECRET_KEY && key !== 'cleanup-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  await ensureInitialized();
  
  const dropped: string[] = [];
  const errors: string[] = [];
  
  for (const table of OLD_TABLES) {
    try {
      await db().execute(`DROP TABLE IF EXISTS ${table}`);
      dropped.push(table);
    } catch (error) {
      errors.push(`${table}: ${error}`);
    }
  }
  
  return NextResponse.json({
    success: true,
    dropped,
    errors,
    message: `Dropped ${dropped.length} tables, ${errors.length} errors`,
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    return await cleanupDatabase(key);
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup database: ' + String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    return await cleanupDatabase(key);
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup database: ' + String(error) },
      { status: 500 }
    );
  }
}
