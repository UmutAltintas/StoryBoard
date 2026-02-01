/**
 * store.ts - Global state management using Zustand
 * 
 * This is the "database" of the app. All data (stories, characters, etc.)
 * is stored here and persisted to localStorage.
 * 
 * Key concepts:
 * - Uses Zustand for simple state management
 * - Uses persist middleware to save to localStorage
 * - Each entity type has: add, update, delete, and get functions
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  Story,
  Character,
  CharacterRelationship,
  Location,
  LoreEntry,
  TimelineEvent,
  IdeaCard,
  IdeaGroup,
  User,
  Chapter,
  Tag,
} from '@/types';

// =============================================================================
// STORE INTERFACE - Defines all state and actions
// =============================================================================

interface StoryBoardState {
  // --- User ---
  user: User | null;
  setUser: (user: User | null) => void;

  // --- Stories ---
  stories: Story[];
  addStory: (story: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>) => Story;
  updateStory: (id: string, updates: Partial<Story>) => void;
  deleteStory: (id: string) => void;
  getStory: (id: string) => Story | undefined;

  // --- Characters ---
  characters: Character[];
  addCharacter: (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => Character;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  getCharactersByStory: (storyId: string) => Character[];
  getCharacter: (id: string) => Character | undefined;

  // --- Character Relationships ---
  relationships: CharacterRelationship[];
  addRelationship: (rel: Omit<CharacterRelationship, 'id' | 'createdAt' | 'updatedAt'>) => CharacterRelationship;
  deleteRelationship: (id: string) => void;
  getRelationshipsByCharacter: (characterId: string) => CharacterRelationship[];

  // --- Locations ---
  locations: Location[];
  addLocation: (location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => Location;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  deleteLocation: (id: string) => void;
  getLocationsByStory: (storyId: string) => Location[];
  getLocation: (id: string) => Location | undefined;

  // --- Lore Entries ---
  loreEntries: LoreEntry[];
  addLoreEntry: (entry: Omit<LoreEntry, 'id' | 'createdAt' | 'updatedAt'>) => LoreEntry;
  updateLoreEntry: (id: string, updates: Partial<LoreEntry>) => void;
  deleteLoreEntry: (id: string) => void;
  getLoreEntriesByStory: (storyId: string) => LoreEntry[];
  getLoreEntry: (id: string) => LoreEntry | undefined;

  // --- Timeline Events ---
  events: TimelineEvent[];
  addEvent: (event: Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>) => TimelineEvent;
  updateEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  deleteEvent: (id: string) => void;
  getEventsByStory: (storyId: string) => TimelineEvent[];
  getEvent: (id: string) => TimelineEvent | undefined;
  reorderEvents: (storyId: string, eventIds: string[]) => void;

  // --- Idea Cards ---
  ideaCards: IdeaCard[];
  addIdeaCard: (card: Omit<IdeaCard, 'id' | 'createdAt' | 'updatedAt'>) => IdeaCard;
  updateIdeaCard: (id: string, updates: Partial<IdeaCard>) => void;
  deleteIdeaCard: (id: string) => void;
  getIdeaCardsByStory: (storyId: string) => IdeaCard[];
  getIdeaCard: (id: string) => IdeaCard | undefined;

  // --- Idea Groups ---
  ideaGroups: IdeaGroup[];
  addIdeaGroup: (group: Omit<IdeaGroup, 'id' | 'createdAt'>) => IdeaGroup;
  getIdeaGroupsByStory: (storyId: string) => IdeaGroup[];

  // --- Chapters ---
  chapters: Chapter[];
  addChapter: (chapter: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt' | 'wordCount'>) => Chapter;
  updateChapter: (id: string, updates: Partial<Chapter>) => void;
  deleteChapter: (id: string) => void;
  getChaptersByStory: (storyId: string) => Chapter[];
  getChapter: (id: string) => Chapter | undefined;
  reorderChapters: (storyId: string, chapterIds: string[]) => void;

  // --- Tags ---
  tags: Tag[];
  addTag: (tag: Omit<Tag, 'id' | 'createdAt'>) => Tag;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  getTagsByStory: (storyId: string) => Tag[];

  // --- Global Search ---
  search: (storyId: string, query: string) => {
    characters: Character[];
    locations: Location[];
    events: TimelineEvent[];
    lore: LoreEntry[];
    ideas: IdeaCard[];
  };

  // --- Data Sync (for user accounts) ---
  loadFromServer: (data: {
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
  }) => void;
  exportData: () => {
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
  };
  clearAll: () => void;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useStoryBoardStore = create<StoryBoardState>()(
  persist(
    (set, get) => ({
      // =========================================================================
      // USER
      // =========================================================================
      user: null,
      setUser: (user) => set({ user }),

      // =========================================================================
      // STORIES
      // =========================================================================
      stories: [],

      addStory: (storyData) => {
        const story: Story = {
          ...storyData,
          id: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ stories: [...state.stories, story] }));
        return story;
      },

      updateStory: (id, updates) => {
        set((state) => ({
          stories: state.stories.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
          ),
        }));
      },

      deleteStory: (id) => {
        // When deleting a story, also delete all its content
        set((state) => ({
          stories: state.stories.filter((s) => s.id !== id),
          characters: state.characters.filter((c) => c.storyId !== id),
          locations: state.locations.filter((l) => l.storyId !== id),
          events: state.events.filter((e) => e.storyId !== id),
          loreEntries: state.loreEntries.filter((l) => l.storyId !== id),
          ideaCards: state.ideaCards.filter((i) => i.storyId !== id),
          ideaGroups: state.ideaGroups.filter((g) => g.storyId !== id),
          relationships: state.relationships.filter((r) => r.storyId !== id),
        }));
      },

      getStory: (id) => get().stories.find((s) => s.id === id),

      // =========================================================================
      // CHARACTERS
      // =========================================================================
      characters: [],

      addCharacter: (characterData) => {
        const character: Character = {
          ...characterData,
          id: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ characters: [...state.characters, character] }));
        return character;
      },

      updateCharacter: (id, updates) => {
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
        }));
      },

      deleteCharacter: (id) => {
        // Also remove any relationships involving this character
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
          relationships: state.relationships.filter(
            (r) => r.character1Id !== id && r.character2Id !== id
          ),
        }));
      },

      getCharactersByStory: (storyId) =>
        get().characters.filter((c) => c.storyId === storyId),

      getCharacter: (id) => get().characters.find((c) => c.id === id),

      // =========================================================================
      // CHARACTER RELATIONSHIPS
      // =========================================================================
      relationships: [],

      addRelationship: (relationshipData) => {
        const relationship: CharacterRelationship = {
          ...relationshipData,
          id: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ relationships: [...state.relationships, relationship] }));
        return relationship;
      },

      deleteRelationship: (id) => {
        set((state) => ({
          relationships: state.relationships.filter((r) => r.id !== id),
        }));
      },

      getRelationshipsByCharacter: (characterId) =>
        get().relationships.filter(
          (r) => r.character1Id === characterId || r.character2Id === characterId
        ),

      // =========================================================================
      // LOCATIONS
      // =========================================================================
      locations: [],

      addLocation: (locationData) => {
        const location: Location = {
          ...locationData,
          id: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ locations: [...state.locations, location] }));
        return location;
      },

      updateLocation: (id, updates) => {
        set((state) => ({
          locations: state.locations.map((l) =>
            l.id === id ? { ...l, ...updates, updatedAt: new Date() } : l
          ),
        }));
      },

      deleteLocation: (id) => {
        set((state) => ({
          locations: state.locations.filter((l) => l.id !== id),
        }));
      },

      getLocationsByStory: (storyId) =>
        get().locations.filter((l) => l.storyId === storyId),

      getLocation: (id) => get().locations.find((l) => l.id === id),

      // =========================================================================
      // LORE ENTRIES
      // =========================================================================
      loreEntries: [],

      addLoreEntry: (entryData) => {
        const entry: LoreEntry = {
          ...entryData,
          id: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ loreEntries: [...state.loreEntries, entry] }));
        return entry;
      },

      updateLoreEntry: (id, updates) => {
        set((state) => ({
          loreEntries: state.loreEntries.map((l) =>
            l.id === id ? { ...l, ...updates, updatedAt: new Date() } : l
          ),
        }));
      },

      deleteLoreEntry: (id) => {
        set((state) => ({
          loreEntries: state.loreEntries.filter((l) => l.id !== id),
        }));
      },

      getLoreEntriesByStory: (storyId) =>
        get().loreEntries.filter((l) => l.storyId === storyId),

      getLoreEntry: (id) => get().loreEntries.find((l) => l.id === id),

      // =========================================================================
      // TIMELINE EVENTS
      // =========================================================================
      events: [],

      addEvent: (eventData) => {
        const event: TimelineEvent = {
          ...eventData,
          id: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ events: [...state.events, event] }));
        return event;
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e
          ),
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        }));
      },

      getEventsByStory: (storyId) =>
        get()
          .events.filter((e) => e.storyId === storyId)
          .sort((a, b) => a.order - b.order), // Sort by order for timeline

      getEvent: (id) => get().events.find((e) => e.id === id),

      reorderEvents: (storyId, eventIds) => {
        // Update the order of events based on new position
        set((state) => ({
          events: state.events.map((e) => {
            if (e.storyId !== storyId) return e;
            const newOrder = eventIds.indexOf(e.id);
            return newOrder !== -1 ? { ...e, order: newOrder } : e;
          }),
        }));
      },

      // =========================================================================
      // IDEA CARDS
      // =========================================================================
      ideaCards: [],

      addIdeaCard: (cardData) => {
        const card: IdeaCard = {
          ...cardData,
          id: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ ideaCards: [...state.ideaCards, card] }));
        return card;
      },

      updateIdeaCard: (id, updates) => {
        set((state) => ({
          ideaCards: state.ideaCards.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
        }));
      },

      deleteIdeaCard: (id) => {
        set((state) => ({
          ideaCards: state.ideaCards.filter((c) => c.id !== id),
        }));
      },

      getIdeaCardsByStory: (storyId) =>
        get()
          .ideaCards.filter((c) => c.storyId === storyId)
          .sort((a, b) => a.order - b.order),

      getIdeaCard: (id) => get().ideaCards.find((c) => c.id === id),

      // =========================================================================
      // IDEA GROUPS
      // =========================================================================
      ideaGroups: [],

      addIdeaGroup: (groupData) => {
        const group: IdeaGroup = {
          ...groupData,
          id: uuidv4(),
          createdAt: new Date(),
        };
        set((state) => ({ ideaGroups: [...state.ideaGroups, group] }));
        return group;
      },

      getIdeaGroupsByStory: (storyId) =>
        get()
          .ideaGroups.filter((g) => g.storyId === storyId)
          .sort((a, b) => (a.order || 0) - (b.order || 0)),

      // =========================================================================
      // CHAPTERS
      // =========================================================================
      chapters: [],

      addChapter: (chapterData) => {
        const wordCount = chapterData.content.trim().split(/\s+/).filter(Boolean).length;
        const chapter: Chapter = {
          ...chapterData,
          id: uuidv4(),
          wordCount,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ chapters: [...state.chapters, chapter] }));
        return chapter;
      },

      updateChapter: (id, updates) => {
        set((state) => ({
          chapters: state.chapters.map((c) => {
            if (c.id !== id) return c;
            const newContent = updates.content ?? c.content;
            const wordCount = newContent.trim().split(/\s+/).filter(Boolean).length;
            return { ...c, ...updates, wordCount, updatedAt: new Date() };
          }),
        }));
      },

      deleteChapter: (id) => {
        set((state) => ({
          chapters: state.chapters.filter((c) => c.id !== id),
        }));
      },

      getChaptersByStory: (storyId) =>
        get()
          .chapters.filter((c) => c.storyId === storyId)
          .sort((a, b) => a.order - b.order),

      getChapter: (id) => get().chapters.find((c) => c.id === id),

      reorderChapters: (storyId, chapterIds) => {
        set((state) => ({
          chapters: state.chapters.map((c) => {
            if (c.storyId !== storyId) return c;
            const newOrder = chapterIds.indexOf(c.id);
            return newOrder !== -1 ? { ...c, order: newOrder } : c;
          }),
        }));
      },

      // =========================================================================
      // TAGS
      // =========================================================================
      tags: [],

      addTag: (tagData) => {
        const tag: Tag = {
          ...tagData,
          id: uuidv4(),
          createdAt: new Date(),
        };
        set((state) => ({ tags: [...state.tags, tag] }));
        return tag;
      },

      updateTag: (id, updates) => {
        set((state) => ({
          tags: state.tags.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTag: (id) => {
        set((state) => ({
          tags: state.tags.filter((t) => t.id !== id),
        }));
      },

      getTagsByStory: (storyId) =>
        get().tags.filter((t) => t.storyId === storyId),

      // =========================================================================
      // GLOBAL SEARCH
      // Searches across all content types in a story
      // =========================================================================
      search: (storyId, query) => {
        const lowerQuery = query.toLowerCase();
        const state = get();

        return {
          characters: state.characters.filter(
            (c) =>
              c.storyId === storyId &&
              (c.name.toLowerCase().includes(lowerQuery) ||
                c.backstory?.toLowerCase().includes(lowerQuery))
          ),
          locations: state.locations.filter(
            (l) =>
              l.storyId === storyId &&
              (l.name.toLowerCase().includes(lowerQuery) ||
                l.description?.toLowerCase().includes(lowerQuery))
          ),
          events: state.events.filter(
            (e) =>
              e.storyId === storyId &&
              (e.title.toLowerCase().includes(lowerQuery) ||
                e.description?.toLowerCase().includes(lowerQuery))
          ),
          lore: state.loreEntries.filter(
            (l) =>
              l.storyId === storyId &&
              (l.title.toLowerCase().includes(lowerQuery) ||
                l.content.toLowerCase().includes(lowerQuery))
          ),
          ideas: state.ideaCards.filter(
            (i) =>
              i.storyId === storyId &&
              (i.title.toLowerCase().includes(lowerQuery) ||
                i.content.toLowerCase().includes(lowerQuery))
          ),
          chapters: state.chapters.filter(
            (c) =>
              c.storyId === storyId &&
              (c.title.toLowerCase().includes(lowerQuery) ||
                c.content.toLowerCase().includes(lowerQuery) ||
                c.summary?.toLowerCase().includes(lowerQuery))
          ),
        };
      },

      // =========================================================================
      // DATA SYNC (for user accounts)
      // =========================================================================
      loadFromServer: (data) => {
        set({
          stories: (data.stories || []).map(s => ({
            ...s,
            themes: s.themes || [],
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
          })),
          characters: (data.characters || []).map(c => ({
            ...c,
            personality: c.personality || [],
            motivations: c.motivations || [],
            goals: c.goals || [],
            flaws: c.flaws || [],
            tags: c.tags || [],
            locationIds: c.locationIds || [],
            eventIds: c.eventIds || [],
            relationshipIds: c.relationshipIds || [],
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
          })),
          locations: (data.locations || []).map(l => ({
            ...l,
            tags: l.tags || [],
            characterIds: l.characterIds || [],
            eventIds: l.eventIds || [],
            createdAt: new Date(l.createdAt),
            updatedAt: new Date(l.updatedAt),
          })),
          events: (data.events || []).map(e => ({
            ...e,
            characterIds: e.characterIds || [],
            tags: e.tags || [],
            createdAt: new Date(e.createdAt),
            updatedAt: new Date(e.updatedAt),
          })),
          relationships: (data.relationships || []).map(r => ({
            ...r,
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
          })),
          loreEntries: (data.loreEntries || []).map(l => ({
            ...l,
            tags: l.tags || [],
            relatedCharacterIds: l.relatedCharacterIds || [],
            relatedLocationIds: l.relatedLocationIds || [],
            relatedEventIds: l.relatedEventIds || [],
            createdAt: new Date(l.createdAt),
            updatedAt: new Date(l.updatedAt),
          })),
          ideaGroups: (data.ideaGroups || []).map(g => ({
            ...g,
            createdAt: new Date(g.createdAt),
          })),
          ideaCards: (data.ideaCards || []).map(i => ({
            ...i,
            tags: i.tags || [],
            relatedCharacterIds: i.relatedCharacterIds || [],
            relatedLocationIds: i.relatedLocationIds || [],
            createdAt: new Date(i.createdAt),
            updatedAt: new Date(i.updatedAt),
          })),
          chapters: (data.chapters || []).map(c => ({
            ...c,
            tags: c.tags || [],
            characterIds: c.characterIds || [],
            locationIds: c.locationIds || [],
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
          })),
          tags: (data.tags || []).map(t => ({
            ...t,
            createdAt: new Date(t.createdAt),
          })),
        });
      },

      exportData: () => {
        const state = get();
        // Helper to safely convert Date or string to ISO string
        const toISO = (d: Date | string): string => {
          if (typeof d === 'string') return d;
          return d.toISOString();
        };
        return {
          stories: state.stories.map(s => ({
            ...s,
            createdAt: toISO(s.createdAt),
            updatedAt: toISO(s.updatedAt),
          })) as unknown as Story[],
          characters: state.characters.map(c => ({
            ...c,
            createdAt: toISO(c.createdAt),
            updatedAt: toISO(c.updatedAt),
          })) as unknown as Character[],
          locations: state.locations.map(l => ({
            ...l,
            createdAt: toISO(l.createdAt),
            updatedAt: toISO(l.updatedAt),
          })) as unknown as Location[],
          events: state.events.map(e => ({
            ...e,
            createdAt: toISO(e.createdAt),
            updatedAt: toISO(e.updatedAt),
          })) as unknown as TimelineEvent[],
          relationships: state.relationships.map(r => ({
            ...r,
            createdAt: toISO(r.createdAt),
            updatedAt: toISO(r.updatedAt),
          })) as unknown as CharacterRelationship[],
          loreEntries: state.loreEntries.map(l => ({
            ...l,
            createdAt: toISO(l.createdAt),
            updatedAt: toISO(l.updatedAt),
          })) as unknown as LoreEntry[],
          ideaGroups: state.ideaGroups.map(g => ({
            ...g,
            createdAt: toISO(g.createdAt),
          })) as unknown as IdeaGroup[],
          ideaCards: state.ideaCards.map(i => ({
            ...i,
            createdAt: toISO(i.createdAt),
            updatedAt: toISO(i.updatedAt),
          })) as unknown as IdeaCard[],
          chapters: state.chapters.map(c => ({
            ...c,
            createdAt: toISO(c.createdAt),
            updatedAt: toISO(c.updatedAt),
          })) as unknown as Chapter[],
          tags: state.tags.map(t => ({
            ...t,
            createdAt: toISO(t.createdAt),
          })) as unknown as Tag[],
        };
      },

      clearAll: () => {
        set({
          user: null,
          stories: [],
          characters: [],
          relationships: [],
          locations: [],
          loreEntries: [],
          events: [],
          ideaCards: [],
          ideaGroups: [],
          chapters: [],
          tags: [],
        });
      },
    }),
    {
      // Persist to localStorage under this key
      name: 'storyboard-storage',
      // Only persist these fields (not functions)
      partialize: (state) => ({
        user: state.user,
        stories: state.stories,
        characters: state.characters,
        relationships: state.relationships,
        locations: state.locations,
        loreEntries: state.loreEntries,
        events: state.events,
        ideaCards: state.ideaCards,
        ideaGroups: state.ideaGroups,
        chapters: state.chapters,
        tags: state.tags,
      }),
      // Skip initial hydration - we'll load from server instead for authenticated users
      skipHydration: false,
      onRehydrateStorage: () => {
        console.log('[Store] Rehydrating from localStorage...');
        return (state, error) => {
          if (error) {
            console.error('[Store] Rehydration error:', error);
          } else {
            console.log('[Store] Rehydrated:', {
              stories: state?.stories?.length || 0,
              chapters: state?.chapters?.length || 0,
            });
          }
        };
      },
    }
  )
);
