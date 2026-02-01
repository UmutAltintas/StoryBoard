/**
 * API Route: GET, POST /api/data/sync
 * 
 * Syncs user story data between client and server.
 * GET: Fetches all user's data from database
 * POST: Saves user's data to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-utils';
import db, { ensureInitialized } from '@/lib/db';

// Types for the data
interface Character {
  id: string;
  storyId: string;
  name: string;
  role: string;
  age?: string;
  appearance?: string;
  personality: string[];
  backstory?: string;
  motivations?: string;
  goals?: string;
  flaws?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Location {
  id: string;
  storyId: string;
  name: string;
  type: string;
  description?: string;
  history?: string;
  significance?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface TimelineEvent {
  id: string;
  storyId: string;
  title: string;
  description?: string;
  date?: string;
  locationId?: string;
  characterIds: string[];
  significance: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface CharacterRelationship {
  id: string;
  storyId: string;
  character1Id: string;
  character2Id: string;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface LoreEntry {
  id: string;
  storyId: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  relatedCharacterIds: string[];
  relatedLocationIds: string[];
  relatedEventIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface IdeaGroup {
  id: string;
  storyId: string;
  name: string;
  color?: string;
  createdAt: string;
}

interface IdeaCard {
  id: string;
  storyId: string;
  groupId?: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  relatedCharacterIds: string[];
  relatedLocationIds: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface Chapter {
  id: string;
  storyId: string;
  title: string;
  content: string;
  summary?: string;
  order: number;
  status: string;
  wordCount: number;
  notes?: string;
  tags: string[];
  characterIds: string[];
  locationIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface Tag {
  id: string;
  storyId: string;
  name: string;
  color: string;
  createdAt: string;
}

interface Story {
  id: string;
  userId: string;
  title: string;
  description?: string;
  genre?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SyncData {
  stories: Story[];
  characters: Character[];
  locations: Location[];
  events: TimelineEvent[];
  relationships: CharacterRelationship[];
  loreEntries: LoreEntry[];
  ideaGroups: IdeaGroup[];
  ideaCards: IdeaCard[];
  chapters: Chapter[];
  tags: Tag[];
}

// GET: Load user's data from database
export async function GET() {
  try {
    await ensureInitialized();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.userId;

    // Fetch all stories for this user
    const storiesResult = await db().execute({
      sql: `SELECT id, user_id as userId, title, description, genre, status, created_at as createdAt, updated_at as updatedAt FROM stories WHERE user_id = ?`,
      args: [userId],
    });
    const stories = storiesResult.rows as unknown as Story[];

    const storyIds = stories.map(s => s.id);
    
    if (storyIds.length === 0) {
      return NextResponse.json({
        stories: [],
        characters: [],
        locations: [],
        events: [],
        relationships: [],
        loreEntries: [],
        ideaGroups: [],
        ideaCards: [],
        chapters: [],
        tags: [],
      });
    }

    const placeholders = storyIds.map(() => '?').join(',');

    // Fetch characters
    const charactersResult = await db().execute({
      sql: `SELECT id, story_id as storyId, name, role, age, appearance, personality, backstory, motivations, goals, flaws, notes, created_at as createdAt, updated_at as updatedAt FROM characters WHERE story_id IN (${placeholders})`,
      args: storyIds,
    });
    // Helper to parse JSON array or convert string to single-item array
    const parseArrayField = (val: unknown): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [val];
        } catch {
          return val ? [val] : [];
        }
      }
      return [];
    };
    const characters = (charactersResult.rows as unknown as Record<string, unknown>[]).map(c => ({
      ...c,
      personality: parseArrayField(c.personality),
      motivations: parseArrayField(c.motivations),
      goals: parseArrayField(c.goals),
      flaws: parseArrayField(c.flaws),
    }));

    // Fetch locations
    const locationsResult = await db().execute({
      sql: `SELECT id, story_id as storyId, name, type, description, history, significance, parent_id as parentId, created_at as createdAt, updated_at as updatedAt FROM locations WHERE story_id IN (${placeholders})`,
      args: storyIds,
    });
    const locations = locationsResult.rows as unknown as Location[];

    // Fetch events with character IDs
    const eventsResult = await db().execute({
      sql: `SELECT id, story_id as storyId, title, description, date, location_id as locationId, significance, event_order as 'order', created_at as createdAt, updated_at as updatedAt FROM events WHERE story_id IN (${placeholders})`,
      args: storyIds,
    });
    const eventsRaw = eventsResult.rows as unknown as (Omit<TimelineEvent, 'characterIds'>)[];

    const events = await Promise.all(eventsRaw.map(async e => {
      const charResult = await db().execute({
        sql: `SELECT character_id FROM event_characters WHERE event_id = ?`,
        args: [e.id],
      });
      const characterIds = (charResult.rows as unknown as { character_id: string }[]).map(row => row.character_id);
      return { ...e, characterIds };
    }));

    // Fetch relationships
    const relationshipsResult = await db().execute({
      sql: `SELECT id, story_id as storyId, character1_id as character1Id, character2_id as character2Id, type, description, created_at as createdAt, updated_at as updatedAt FROM relationships WHERE story_id IN (${placeholders})`,
      args: storyIds,
    });
    const relationships = relationshipsResult.rows as unknown as CharacterRelationship[];

    // Fetch lore entries with linked items
    const loreResult = await db().execute({
      sql: `SELECT id, story_id as storyId, title, category, content, tags, created_at as createdAt, updated_at as updatedAt FROM lore_entries WHERE story_id IN (${placeholders})`,
      args: storyIds,
    });
    const loreEntriesRaw = loreResult.rows as unknown as (Omit<LoreEntry, 'tags' | 'relatedCharacterIds' | 'relatedLocationIds' | 'relatedEventIds'> & { tags: string })[];

    const loreEntries = await Promise.all(loreEntriesRaw.map(async l => {
      const [charResult, locResult, eventResult] = await Promise.all([
        db().execute({ sql: `SELECT character_id FROM lore_characters WHERE lore_id = ?`, args: [l.id] }),
        db().execute({ sql: `SELECT location_id FROM lore_locations WHERE lore_id = ?`, args: [l.id] }),
        db().execute({ sql: `SELECT event_id FROM lore_events WHERE lore_id = ?`, args: [l.id] }),
      ]);
      return {
        ...l,
        tags: l.tags ? JSON.parse(l.tags as string) : [],
        relatedCharacterIds: (charResult.rows as unknown as { character_id: string }[]).map(row => row.character_id),
        relatedLocationIds: (locResult.rows as unknown as { location_id: string }[]).map(row => row.location_id),
        relatedEventIds: (eventResult.rows as unknown as { event_id: string }[]).map(row => row.event_id),
      };
    }));

    // Fetch idea groups
    const ideaGroupsResult = await db().execute({
      sql: `SELECT id, story_id as storyId, name, color, created_at as createdAt FROM idea_groups WHERE story_id IN (${placeholders})`,
      args: storyIds,
    });
    const ideaGroups = ideaGroupsResult.rows as unknown as IdeaGroup[];

    // Fetch idea cards with linked items
    const ideaCardsResult = await db().execute({
      sql: `SELECT id, story_id as storyId, group_id as groupId, title, content, type, card_order as 'order', created_at as createdAt, updated_at as updatedAt FROM idea_cards WHERE story_id IN (${placeholders})`,
      args: storyIds,
    });
    const ideaCardsRaw = ideaCardsResult.rows as unknown as (Omit<IdeaCard, 'tags' | 'relatedCharacterIds' | 'relatedLocationIds'> & { tags?: string })[];

    const ideaCards = await Promise.all(ideaCardsRaw.map(async i => {
      const [charResult, locResult] = await Promise.all([
        db().execute({ sql: `SELECT character_id FROM idea_characters WHERE idea_id = ?`, args: [i.id] }),
        db().execute({ sql: `SELECT location_id FROM idea_locations WHERE idea_id = ?`, args: [i.id] }),
      ]);
      return {
        ...i,
        tags: [],
        relatedCharacterIds: (charResult.rows as unknown as { character_id: string }[]).map(row => row.character_id),
        relatedLocationIds: (locResult.rows as unknown as { location_id: string }[]).map(row => row.location_id),
      };
    }));

    // Fetch chapters with linked characters and locations
    const chaptersResult = await db().execute({
      sql: `SELECT id, story_id as storyId, title, content, summary, chapter_order as 'order', status, word_count as wordCount, notes, tags, created_at as createdAt, updated_at as updatedAt FROM chapters WHERE story_id IN (${placeholders})`,
      args: storyIds,
    });
    const chaptersRaw = chaptersResult.rows as unknown as (Omit<Chapter, 'tags' | 'characterIds' | 'locationIds'> & { tags: string })[];

    const chapters = await Promise.all(chaptersRaw.map(async c => {
      const [charResult, locResult] = await Promise.all([
        db().execute({ sql: `SELECT character_id FROM chapter_characters WHERE chapter_id = ?`, args: [c.id] }),
        db().execute({ sql: `SELECT location_id FROM chapter_locations WHERE chapter_id = ?`, args: [c.id] }),
      ]);
      return {
        ...c,
        tags: c.tags ? JSON.parse(c.tags as string) : [],
        characterIds: (charResult.rows as unknown as { character_id: string }[]).map(row => row.character_id),
        locationIds: (locResult.rows as unknown as { location_id: string }[]).map(row => row.location_id),
      };
    }));

    // Fetch tags
    const tagsResult = await db().execute({
      sql: `SELECT id, story_id as storyId, name, color, created_at as createdAt FROM tags WHERE story_id IN (${placeholders})`,
      args: storyIds,
    });
    const tags = tagsResult.rows as unknown as Tag[];

    return NextResponse.json({
      stories,
      characters,
      locations,
      events,
      relationships,
      loreEntries,
      ideaGroups,
      ideaCards,
      chapters,
      tags,
    });
  } catch (error) {
    console.error('Data fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST: Save user's data to database
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.userId;
    const data: SyncData = await request.json();

    // Clear existing data for this user's stories
    const existingStoriesResult = await db().execute({
      sql: 'SELECT id FROM stories WHERE user_id = ?',
      args: [userId],
    });
    const existingStoryIds = (existingStoriesResult.rows as unknown as { id: string }[]).map(s => s.id);
    
    if (existingStoryIds.length > 0) {
      const placeholders = existingStoryIds.map(() => '?').join(',');
      // Delete in order respecting foreign keys
      await db().execute({ sql: `DELETE FROM event_characters WHERE event_id IN (SELECT id FROM events WHERE story_id IN (${placeholders}))`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM lore_characters WHERE lore_id IN (SELECT id FROM lore_entries WHERE story_id IN (${placeholders}))`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM lore_locations WHERE lore_id IN (SELECT id FROM lore_entries WHERE story_id IN (${placeholders}))`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM lore_events WHERE lore_id IN (SELECT id FROM lore_entries WHERE story_id IN (${placeholders}))`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM idea_characters WHERE idea_id IN (SELECT id FROM idea_cards WHERE story_id IN (${placeholders}))`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM idea_locations WHERE idea_id IN (SELECT id FROM idea_cards WHERE story_id IN (${placeholders}))`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM chapter_characters WHERE chapter_id IN (SELECT id FROM chapters WHERE story_id IN (${placeholders}))`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM chapter_locations WHERE chapter_id IN (SELECT id FROM chapters WHERE story_id IN (${placeholders}))`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM idea_cards WHERE story_id IN (${placeholders})`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM idea_groups WHERE story_id IN (${placeholders})`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM lore_entries WHERE story_id IN (${placeholders})`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM relationships WHERE story_id IN (${placeholders})`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM events WHERE story_id IN (${placeholders})`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM chapters WHERE story_id IN (${placeholders})`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM tags WHERE story_id IN (${placeholders})`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM locations WHERE story_id IN (${placeholders})`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM characters WHERE story_id IN (${placeholders})`, args: existingStoryIds });
      await db().execute({ sql: `DELETE FROM stories WHERE user_id = ?`, args: [userId] });
    }

    // Insert stories
    for (const story of data.stories) {
      await db().execute({
        sql: `INSERT INTO stories (id, user_id, title, description, genre, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [story.id, userId, story.title, story.description || null, story.genre || null, story.status, story.createdAt, story.updatedAt],
      });
    }

    // Insert characters
    for (const char of data.characters) {
      await db().execute({
        sql: `INSERT INTO characters (id, story_id, name, role, age, appearance, personality, backstory, motivations, goals, flaws, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          char.id, 
          char.storyId, 
          char.name, 
          char.role, 
          char.age || null, 
          char.appearance || null, 
          JSON.stringify(char.personality || []), 
          char.backstory || null, 
          JSON.stringify(char.motivations || []), 
          JSON.stringify(char.goals || []), 
          JSON.stringify(char.flaws || []), 
          char.notes || null, 
          char.createdAt, 
          char.updatedAt
        ],
      });
    }

    // Insert locations
    for (const loc of data.locations) {
      await db().execute({
        sql: `INSERT INTO locations (id, story_id, name, type, description, history, significance, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [loc.id, loc.storyId, loc.name, loc.type, loc.description || null, loc.history || null, loc.significance || null, loc.parentId || null, loc.createdAt, loc.updatedAt],
      });
    }

    // Insert events
    for (const event of data.events) {
      await db().execute({
        sql: `INSERT INTO events (id, story_id, title, description, date, location_id, significance, event_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [event.id, event.storyId, event.title, event.description || null, event.date || null, event.locationId || null, event.significance, event.order, event.createdAt, event.updatedAt],
      });
      for (const charId of event.characterIds) {
        await db().execute({
          sql: `INSERT INTO event_characters (event_id, character_id) VALUES (?, ?)`,
          args: [event.id, charId],
        });
      }
    }

    // Insert relationships
    for (const rel of data.relationships) {
      await db().execute({
        sql: `INSERT INTO relationships (id, story_id, character1_id, character2_id, type, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [rel.id, rel.storyId, rel.character1Id, rel.character2Id, rel.type, rel.description || null, rel.createdAt, rel.updatedAt],
      });
    }

    // Insert lore entries
    for (const lore of data.loreEntries || []) {
      await db().execute({
        sql: `INSERT INTO lore_entries (id, story_id, title, category, content, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [lore.id, lore.storyId, lore.title, lore.category, lore.content, JSON.stringify(lore.tags || []), lore.createdAt, lore.updatedAt],
      });
      for (const charId of lore.relatedCharacterIds || []) {
        await db().execute({ sql: `INSERT INTO lore_characters (lore_id, character_id) VALUES (?, ?)`, args: [lore.id, charId] });
      }
      for (const locId of lore.relatedLocationIds || []) {
        await db().execute({ sql: `INSERT INTO lore_locations (lore_id, location_id) VALUES (?, ?)`, args: [lore.id, locId] });
      }
      for (const eventId of lore.relatedEventIds || []) {
        await db().execute({ sql: `INSERT INTO lore_events (lore_id, event_id) VALUES (?, ?)`, args: [lore.id, eventId] });
      }
    }

    // Insert idea groups
    for (const group of data.ideaGroups) {
      await db().execute({
        sql: `INSERT INTO idea_groups (id, story_id, name, color, created_at) VALUES (?, ?, ?, ?, ?)`,
        args: [group.id, group.storyId, group.name, group.color || null, group.createdAt],
      });
    }

    // Insert idea cards
    for (const idea of data.ideaCards || []) {
      await db().execute({
        sql: `INSERT INTO idea_cards (id, story_id, group_id, title, content, type, card_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [idea.id, idea.storyId, idea.groupId || null, idea.title, idea.content, idea.type, idea.order, idea.createdAt, idea.updatedAt],
      });
      for (const charId of idea.relatedCharacterIds || []) {
        await db().execute({ sql: `INSERT INTO idea_characters (idea_id, character_id) VALUES (?, ?)`, args: [idea.id, charId] });
      }
      for (const locId of idea.relatedLocationIds || []) {
        await db().execute({ sql: `INSERT INTO idea_locations (idea_id, location_id) VALUES (?, ?)`, args: [idea.id, locId] });
      }
    }

    // Insert chapters
    for (const chapter of data.chapters || []) {
      await db().execute({
        sql: `INSERT INTO chapters (id, story_id, title, content, summary, chapter_order, status, word_count, notes, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [chapter.id, chapter.storyId, chapter.title, chapter.content || '', chapter.summary || null, chapter.order, chapter.status, chapter.wordCount, chapter.notes || null, JSON.stringify(chapter.tags || []), chapter.createdAt, chapter.updatedAt],
      });
      for (const charId of chapter.characterIds || []) {
        await db().execute({ sql: `INSERT INTO chapter_characters (chapter_id, character_id) VALUES (?, ?)`, args: [chapter.id, charId] });
      }
      for (const locId of chapter.locationIds || []) {
        await db().execute({ sql: `INSERT INTO chapter_locations (chapter_id, location_id) VALUES (?, ?)`, args: [chapter.id, locId] });
      }
    }

    // Insert tags
    for (const tag of data.tags || []) {
      await db().execute({
        sql: `INSERT INTO tags (id, story_id, name, color, created_at) VALUES (?, ?, ?, ?, ?)`,
        args: [tag.id, tag.storyId, tag.name, tag.color, tag.createdAt],
      });
    }

    console.log('[Sync] Data saved successfully:', {
      stories: data.stories?.length || 0,
      chapters: data.chapters?.length || 0,
      loreEntries: data.loreEntries?.length || 0,
      ideaCards: data.ideaCards?.length || 0,
      tags: data.tags?.length || 0,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Data save error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to save data', details: errorMessage }, { status: 500 });
  }
}
