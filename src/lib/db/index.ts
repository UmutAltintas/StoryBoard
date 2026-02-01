/**
 * Database module using Turso (libSQL)
 * 
 * This connects to a Turso cloud SQLite database for storing user accounts 
 * and their story data. Works in serverless environments like Vercel.
 */

import { createClient, Client } from '@libsql/client';

// Lazy client initialization to avoid issues during build
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

// Initialize tables
async function initializeDatabase(): Promise<void> {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      genre TEXT,
      status TEXT DEFAULT 'planning',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'supporting',
      age TEXT,
      appearance TEXT,
      personality TEXT,
      backstory TEXT,
      motivations TEXT,
      goals TEXT,
      flaws TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'other',
      description TEXT,
      history TEXT,
      significance TEXT,
      parent_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES locations(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT,
      location_id TEXT,
      significance TEXT DEFAULT 'minor',
      event_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS event_characters (
      event_id TEXT NOT NULL,
      character_id TEXT NOT NULL,
      PRIMARY KEY (event_id, character_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS relationships (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      character1_id TEXT NOT NULL,
      character2_id TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
      FOREIGN KEY (character1_id) REFERENCES characters(id) ON DELETE CASCADE,
      FOREIGN KEY (character2_id) REFERENCES characters(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS lore_entries (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'other',
      content TEXT,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS lore_characters (
      lore_id TEXT NOT NULL,
      character_id TEXT NOT NULL,
      PRIMARY KEY (lore_id, character_id),
      FOREIGN KEY (lore_id) REFERENCES lore_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS lore_locations (
      lore_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      PRIMARY KEY (lore_id, location_id),
      FOREIGN KEY (lore_id) REFERENCES lore_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS lore_events (
      lore_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      PRIMARY KEY (lore_id, event_id),
      FOREIGN KEY (lore_id) REFERENCES lore_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS idea_groups (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS idea_cards (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      group_id TEXT,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT DEFAULT 'note',
      card_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES idea_groups(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      summary TEXT,
      chapter_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
      word_count INTEGER DEFAULT 0,
      notes TEXT,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS chapter_characters (
      chapter_id TEXT NOT NULL,
      character_id TEXT NOT NULL,
      PRIMARY KEY (chapter_id, character_id),
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS chapter_locations (
      chapter_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      PRIMARY KEY (chapter_id, location_id),
      FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      story_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS idea_characters (
      idea_id TEXT NOT NULL,
      character_id TEXT NOT NULL,
      PRIMARY KEY (idea_id, character_id),
      FOREIGN KEY (idea_id) REFERENCES idea_cards(id) ON DELETE CASCADE,
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS idea_locations (
      idea_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      PRIMARY KEY (idea_id, location_id),
      FOREIGN KEY (idea_id) REFERENCES idea_cards(id) ON DELETE CASCADE,
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_characters_story ON characters(story_id)`,
    `CREATE INDEX IF NOT EXISTS idx_locations_story ON locations(story_id)`,
    `CREATE INDEX IF NOT EXISTS idx_events_story ON events(story_id)`,
    `CREATE INDEX IF NOT EXISTS idx_relationships_story ON relationships(story_id)`,
    `CREATE INDEX IF NOT EXISTS idx_lore_story ON lore_entries(story_id)`,
    `CREATE INDEX IF NOT EXISTS idx_ideas_story ON idea_cards(story_id)`,
    `CREATE INDEX IF NOT EXISTS idx_chapters_story ON chapters(story_id)`,
    `CREATE INDEX IF NOT EXISTS idx_tags_story ON tags(story_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
  ];

  for (const sql of statements) {
    await getDb().execute(sql);
  }
}

// Initialize on first import
let initialized = false;
export async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    await initializeDatabase();
    initialized = true;
  }
}

export { getDb as default, getDb };
