/**
 * API Route: GET /api/admin/reset-db
 * 
 * DANGEROUS: Drops ALL tables and recreates fresh schema.
 * Only use this to completely reset the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (key !== 'reset-all-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const database = db();
    const dropped: string[] = [];
    const created: string[] = [];
    
    // Step 1: Get all existing tables
    const tablesResult = await database.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    const existingTables = tablesResult.rows.map(r => r.name as string);
    
    // Step 2: Drop ALL existing tables
    for (const table of existingTables) {
      try {
        await database.execute(`DROP TABLE IF EXISTS "${table}"`);
        dropped.push(table);
      } catch (error) {
        console.error(`Failed to drop ${table}:`, error);
      }
    }
    
    // Step 3: Create fresh schema (only 3 tables)
    await database.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    created.push('users');
    
    await database.execute(`
      CREATE TABLE IF NOT EXISTS user_data (
        user_id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    created.push('user_data');
    
    await database.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    created.push('sessions');
    
    return NextResponse.json({
      success: true,
      dropped,
      created,
      message: `Dropped ${dropped.length} tables, created ${created.length} tables`,
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset database: ' + String(error) },
      { status: 500 }
    );
  }
}
