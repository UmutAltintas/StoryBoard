/**
 * types.ts - All TypeScript type definitions for StoryBoard
 * 
 * This file contains every interface and type used throughout the app.
 * Keeping them in one place makes it easy to understand the data model.
 */

// =============================================================================
// USER & AUTHENTICATION
// =============================================================================

/** Represents a logged-in user */
export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  avatar?: string;
  createdAt?: Date;
}

// =============================================================================
// STORY (The main container for all content)
// =============================================================================

/** A story workspace - contains characters, locations, lore, etc. */
export interface Story {
  id: string;
  userId: string;
  title: string;
  description?: string;
  genre?: string;              // e.g., "Fantasy", "Sci-Fi", "Mystery"
  themes: string[];            // e.g., ["Love", "Redemption", "Power"]
  premise?: string;            // One-line summary of the story
  status: 'planning' | 'in-progress' | 'on-hold' | 'completed';
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// CHARACTERS
// =============================================================================

/** A character in a story */
export interface Character {
  id: string;
  storyId: string;             // Which story this belongs to
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  avatar?: string;
  appearance?: string;         // Physical description
  personality: string[];       // e.g., ["Brave", "Stubborn", "Loyal"]
  motivations: string[];       // What drives them
  goals: string[];             // What they want to achieve
  flaws: string[];             // Character weaknesses
  backstory?: string;          // Their history
  notes?: string;              // Any additional notes
  tags: string[];              // Custom tags for organization
  
  // Links to other elements
  locationIds: string[];       // Places they frequent
  eventIds: string[];          // Events they're involved in
  relationshipIds: string[];   // Their relationships
  
  createdAt: Date;
  updatedAt: Date;
}

/** A relationship between two characters */
export interface CharacterRelationship {
  id: string;
  storyId: string;
  character1Id: string;        // First character
  character2Id: string;        // Second character
  type: string;                // e.g., "Friend", "Enemy", "Sibling"
  description?: string;        // Details about the relationship
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// LOCATIONS
// =============================================================================

/** A place in your story world */
export interface Location {
  id: string;
  storyId: string;
  name: string;
  type: 'city' | 'country' | 'building' | 'natural' | 'fictional' | 'other';
  description?: string;
  history?: string;            // The location's backstory
  significance?: string;       // Why it matters to the story
  parentLocationId?: string;   // For nested locations (e.g., room in building)
  tags: string[];              // Custom tags for organization
  
  // Links to other elements
  characterIds: string[];      // Characters found here
  eventIds: string[];          // Events that happen here
  
  notes?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// LORE (World-building details)
// =============================================================================

/** Lore categories for organizing world-building content */
export type LoreCategory = 
  | 'magic-system' 
  | 'politics' 
  | 'history' 
  | 'technology' 
  | 'species' 
  | 'organization' 
  | 'culture' 
  | 'religion' 
  | 'other';

/** A piece of world-building lore */
export interface LoreEntry {
  id: string;
  storyId: string;
  title: string;
  category: LoreCategory;
  content: string;             // The actual lore content (can be long)
  tags: string[];              // For easy filtering
  
  // Links to related elements
  relatedCharacterIds: string[];
  relatedLocationIds: string[];
  relatedEventIds: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// TIMELINE (Chronological events)
// =============================================================================

/** An event on the story timeline */
export interface TimelineEvent {
  id: string;
  storyId: string;
  title: string;
  description?: string;
  date?: string;               // Can be real date or fictional ("Year 1 of the War")
  order: number;               // Position in timeline (for drag-and-drop)
  locationId?: string;         // Where it happens
  characterIds: string[];      // Who's involved
  significance: 'major' | 'minor' | 'background';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// IDEAS (Scene/Idea Board)
// =============================================================================

/** Types of idea cards */
export type IdeaType = 'scene' | 'plot-twist' | 'dialogue' | 'question' | 'note' | 'other';

/** An idea card for brainstorming */
export interface IdeaCard {
  id: string;
  storyId: string;
  title: string;
  content: string;
  type: IdeaType;
  color?: string;              // Visual color coding
  groupId?: string;            // Which group it belongs to (optional)
  order: number;               // Position in list
  tags: string[];              // Custom tags for organization
  
  // Links to related elements
  relatedCharacterIds: string[];
  relatedLocationIds: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

/** A group/folder for organizing ideas */
export interface IdeaGroup {
  id: string;
  storyId: string;
  name: string;
  color?: string;
  order?: number;
  createdAt: Date;
}

// =============================================================================
// CHAPTERS (For writing the actual story)
// =============================================================================

/** Status of a chapter */
export type ChapterStatus = 'draft' | 'revision' | 'complete';

/** A chapter or scene in your story */
export interface Chapter {
  id: string;
  storyId: string;
  title: string;
  content: string;             // The actual written content
  summary?: string;            // Brief summary of what happens
  order: number;               // Position in the story
  status: ChapterStatus;
  wordCount: number;           // Automatically calculated
  notes?: string;              // Author notes for this chapter
  tags: string[];              // Custom tags
  
  // Links to related elements
  characterIds: string[];      // Characters appearing in this chapter
  locationIds: string[];       // Locations featured in this chapter
  
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// TAGS (Custom labels for organization)
// =============================================================================

/** A reusable tag for organizing story elements */
export interface Tag {
  id: string;
  storyId: string;
  name: string;
  color: string;               // Hex color for display
  createdAt: Date;
}

// =============================================================================
// CONNECTIONS (For the connections visualization)
// =============================================================================

/** Types of elements that can be connected */
export type ElementType = 'character' | 'location' | 'event' | 'lore' | 'idea';

/** A connection between two story elements */
export interface Connection {
  id: string;
  sourceType: ElementType;
  sourceId: string;
  targetType: ElementType;
  targetId: string;
  label?: string;              // Description of the connection
}
