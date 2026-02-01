/**
 * Simple Database Module
 * 
 * Uses just 2 tables:
 * - users: for authentication
 * - user_data: stores ALL story data as JSON per user
 * 
 * This is simple, fast, and eliminates sync complexity.
 */

import { createClient, Client } from '@libsql/client';

let db: Client | null = null;

function getDb(): Client {
  if (!db) {
    db = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return db;
}

// Simple 3-table schema
async function initializeDatabase(): Promise<void> {
  await getDb().execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await getDb().execute(`
    CREATE TABLE IF NOT EXISTS user_data (
      user_id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  await getDb().execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

let initialized = false;

export async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    await initializeDatabase();
    initialized = true;
  }
}

// ============================================================================
// USER DATA OPERATIONS - Simple JSON storage
// ============================================================================

export async function getUserData(userId: string): Promise<object | null> {
  await ensureInitialized();
  
  const result = await getDb().execute({
    sql: 'SELECT data FROM user_data WHERE user_id = ?',
    args: [userId],
  });
  
  if (result.rows.length === 0) {
    return null;
  }
  
  try {
    return JSON.parse(result.rows[0].data as string);
  } catch {
    return null;
  }
}

export async function saveUserData(userId: string, data: object): Promise<void> {
  await ensureInitialized();
  
  const jsonData = JSON.stringify(data);
  const now = new Date().toISOString();
  
  await getDb().execute({
    sql: `INSERT INTO user_data (user_id, data, updated_at) 
          VALUES (?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET data = ?, updated_at = ?`,
    args: [userId, jsonData, now, jsonData, now],
  });
}

export { getDb as default, getDb };
