/**
 * GlobalSearch.tsx - Command palette for searching story content
 * 
 * Opens with ⌘K (Mac) or Ctrl+K (Windows/Linux).
 * Searches across all content types: characters, locations, events, lore, ideas.
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// Store
import { useStoryBoardStore } from '@/lib/store';

// UI Components
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';

// Icons
import { Users, MapPin, Clock, BookMarked, Lightbulb } from 'lucide-react';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface GlobalSearchProps {
  storyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function GlobalSearch({ storyId, open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const { search } = useStoryBoardStore();
  const [query, setQuery] = useState('');

  // Register keyboard shortcut (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Search results (computed from query)
  const results = useMemo(() => {
    return query.trim() ? search(storyId, query) : null;
  }, [query, storyId, search]);

  // Navigate to selected item
  const handleSelect = (type: string, id: string) => {
    onOpenChange(false);
    setQuery('');
    router.push(`/story/${storyId}/${type}/${id}`);
  };

  // Check if we have any results
  const hasResults = results && (
    results.characters.length > 0 ||
    results.locations.length > 0 ||
    results.events.length > 0 ||
    results.lore.length > 0 ||
    results.ideas.length > 0
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search characters, locations, events, lore, ideas..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {/* Empty state */}
        {query && !hasResults && (
          <CommandEmpty>No results found for &quot;{query}&quot;</CommandEmpty>
        )}

        {/* Characters */}
        {results && results.characters && results.characters.length > 0 && (
          <CommandGroup heading="Characters">
            {results.characters.map((character) => (
              <CommandItem
                key={character.id}
                onSelect={() => handleSelect('characters', character.id)}
                className="cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4 text-amber-600" />
                <span>{character.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {character.role}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Locations */}
        {results && results.locations && results.locations.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Locations">
              {results.locations.map((location) => (
                <CommandItem
                  key={location.id}
                  onSelect={() => handleSelect('locations', location.id)}
                  className="cursor-pointer"
                >
                  <MapPin className="mr-2 h-4 w-4 text-blue-600" />
                  <span>{location.name}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {location.type}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Timeline Events */}
        {results && results.events && results.events.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Timeline Events">
              {results.events.map((event) => (
                <CommandItem
                  key={event.id}
                  onSelect={() => handleSelect('timeline', event.id)}
                  className="cursor-pointer"
                >
                  <Clock className="mr-2 h-4 w-4 text-purple-600" />
                  <span>{event.title}</span>
                  {event.date && (
                    <span className="ml-auto text-xs text-stone-400">{event.date}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Lore */}
        {results && results.lore && results.lore.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Lore">
              {results.lore.map((entry) => (
                <CommandItem
                  key={entry.id}
                  onSelect={() => handleSelect('lore', entry.id)}
                  className="cursor-pointer"
                >
                  <BookMarked className="mr-2 h-4 w-4 text-green-600" />
                  <span>{entry.title}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {entry.category.replace('-', ' ')}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Ideas */}
        {results && results.ideas && results.ideas.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Ideas">
              {results.ideas.map((idea) => (
                <CommandItem
                  key={idea.id}
                  onSelect={() => handleSelect('ideas', idea.id)}
                  className="cursor-pointer"
                >
                  <Lightbulb className="mr-2 h-4 w-4 text-yellow-600" />
                  <span>{idea.title}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {idea.type.replace('-', ' ')}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
