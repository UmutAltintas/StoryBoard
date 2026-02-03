'use client';

import { useState, useMemo } from 'react';
import { useStoryBoardStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  MapPin,
  Clock,
  BookMarked,
  Lightbulb,
  Network,
  ArrowRight,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionsPageProps {
  storyId: string;
}

type ElementType = 'character' | 'location' | 'event' | 'lore' | 'idea';

interface ElementData {
  id: string;
  name: string;
  type: ElementType;
  connections: {
    type: ElementType;
    id: string;
    name: string;
    relationship?: string;
  }[];
}

const typeIcons: Record<ElementType, React.ComponentType<{ className?: string }>> = {
  character: Users,
  location: MapPin,
  event: Clock,
  lore: BookMarked,
  idea: Lightbulb,
};

const typeColors: Record<ElementType, string> = {
  character: 'bg-amber-100 text-amber-700 border-amber-200',
  location: 'bg-blue-100 text-blue-700 border-blue-200',
  event: 'bg-purple-100 text-purple-700 border-purple-200',
  lore: 'bg-green-100 text-green-700 border-green-200',
  idea: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const typeBgColors: Record<ElementType, string> = {
  character: 'bg-amber-50',
  location: 'bg-blue-50',
  event: 'bg-purple-50',
  lore: 'bg-green-50',
  idea: 'bg-yellow-50',
};

export function ConnectionsPage({ storyId }: ConnectionsPageProps) {
  const {
    getCharactersByStory,
    getLocationsByStory,
    getEventsByStory,
    getLoreEntriesByStory,
    getIdeaCardsByStory,
    getRelationshipsByCharacter,
    getCharacter,
    getLocation,
    getEvent,
    getLoreEntry,
    getIdeaCard,
  } = useStoryBoardStore();

  const characters = getCharactersByStory(storyId);
  const locations = getLocationsByStory(storyId);
  const events = getEventsByStory(storyId);
  const loreEntries = getLoreEntriesByStory(storyId);
  const ideaCards = getIdeaCardsByStory(storyId);

  const [selectedType, setSelectedType] = useState<ElementType>('character');
  const [selectedElementId, setSelectedElementId] = useState<string>('');

  const elements = useMemo(() => {
    switch (selectedType) {
      case 'character':
        return characters.map((c) => ({ id: c.id, name: c.name }));
      case 'location':
        return locations.map((l) => ({ id: l.id, name: l.name }));
      case 'event':
        return events.map((e) => ({ id: e.id, name: e.title }));
      case 'lore':
        return loreEntries.map((l) => ({ id: l.id, name: l.title }));
      case 'idea':
        return ideaCards.map((i) => ({ id: i.id, name: i.title }));
      default:
        return [];
    }
  }, [selectedType, characters, locations, events, loreEntries, ideaCards]);

  const selectedElement: ElementData | null = useMemo(() => {
    if (!selectedElementId) return null;

    const connections: ElementData['connections'] = [];

    switch (selectedType) {
      case 'character': {
        const character = getCharacter(selectedElementId);
        if (!character) return null;

        // Character relationships
        const relationships = getRelationshipsByCharacter(selectedElementId);
        relationships.forEach((rel) => {
          const relatedId =
            rel.character1Id === selectedElementId
              ? rel.character2Id
              : rel.character1Id;
          const relatedChar = getCharacter(relatedId);
          if (relatedChar) {
            connections.push({
              type: 'character',
              id: relatedChar.id,
              name: relatedChar.name,
              relationship: rel.type,
            });
          }
        });

        // Character's locations
        character.locationIds.forEach((locId) => {
          const loc = getLocation(locId);
          if (loc) {
            connections.push({
              type: 'location',
              id: loc.id,
              name: loc.name,
              relationship: 'Appears in',
            });
          }
        });

        // Character's events
        character.eventIds.forEach((eventId) => {
          const event = getEvent(eventId);
          if (event) {
            connections.push({
              type: 'event',
              id: event.id,
              name: event.title,
              relationship: 'Involved in',
            });
          }
        });

        // Events featuring this character
        events.forEach((event) => {
          if (event.characterIds.includes(selectedElementId)) {
            if (!connections.find((c) => c.type === 'event' && c.id === event.id)) {
              connections.push({
                type: 'event',
                id: event.id,
                name: event.title,
                relationship: 'Involved in',
              });
            }
          }
        });

        // Lore mentioning this character
        loreEntries.forEach((lore) => {
          if (lore.relatedCharacterIds.includes(selectedElementId)) {
            connections.push({
              type: 'lore',
              id: lore.id,
              name: lore.title,
              relationship: 'Mentioned in',
            });
          }
        });

        // Ideas related to this character
        ideaCards.forEach((idea) => {
          if (idea.relatedCharacterIds.includes(selectedElementId)) {
            connections.push({
              type: 'idea',
              id: idea.id,
              name: idea.title,
              relationship: 'Related idea',
            });
          }
        });

        return {
          id: character.id,
          name: character.name,
          type: 'character',
          connections,
        };
      }

      case 'location': {
        const location = getLocation(selectedElementId);
        if (!location) return null;

        // Characters in this location
        location.characterIds.forEach((charId) => {
          const char = getCharacter(charId);
          if (char) {
            connections.push({
              type: 'character',
              id: char.id,
              name: char.name,
              relationship: 'Located here',
            });
          }
        });

        // Characters with this location
        characters.forEach((char) => {
          if (char.locationIds.includes(selectedElementId)) {
            if (!connections.find((c) => c.type === 'character' && c.id === char.id)) {
              connections.push({
                type: 'character',
                id: char.id,
                name: char.name,
                relationship: 'Located here',
              });
            }
          }
        });

        // Events at this location
        events.forEach((event) => {
          if (event.locationId === selectedElementId) {
            connections.push({
              type: 'event',
              id: event.id,
              name: event.title,
              relationship: 'Takes place here',
            });
          }
        });

        // Child locations
        locations.forEach((loc) => {
          if (loc.parentLocationId === selectedElementId) {
            connections.push({
              type: 'location',
              id: loc.id,
              name: loc.name,
              relationship: 'Sub-location',
            });
          }
        });

        // Parent location
        if (location.parentLocationId) {
          const parent = getLocation(location.parentLocationId);
          if (parent) {
            connections.push({
              type: 'location',
              id: parent.id,
              name: parent.name,
              relationship: 'Parent location',
            });
          }
        }

        // Lore mentioning this location
        loreEntries.forEach((lore) => {
          if (lore.relatedLocationIds.includes(selectedElementId)) {
            connections.push({
              type: 'lore',
              id: lore.id,
              name: lore.title,
              relationship: 'Mentioned in',
            });
          }
        });

        // Ideas related to this location
        ideaCards.forEach((idea) => {
          if (idea.relatedLocationIds.includes(selectedElementId)) {
            connections.push({
              type: 'idea',
              id: idea.id,
              name: idea.title,
              relationship: 'Related idea',
            });
          }
        });

        return {
          id: location.id,
          name: location.name,
          type: 'location',
          connections,
        };
      }

      case 'event': {
        const event = getEvent(selectedElementId);
        if (!event) return null;

        // Characters in this event
        event.characterIds.forEach((charId) => {
          const char = getCharacter(charId);
          if (char) {
            connections.push({
              type: 'character',
              id: char.id,
              name: char.name,
              relationship: 'Involved',
            });
          }
        });

        // Location of this event
        if (event.locationId) {
          const loc = getLocation(event.locationId);
          if (loc) {
            connections.push({
              type: 'location',
              id: loc.id,
              name: loc.name,
              relationship: 'Takes place in',
            });
          }
        }

        // Lore mentioning this event
        loreEntries.forEach((lore) => {
          if (lore.relatedEventIds.includes(selectedElementId)) {
            connections.push({
              type: 'lore',
              id: lore.id,
              name: lore.title,
              relationship: 'Mentioned in',
            });
          }
        });

        return {
          id: event.id,
          name: event.title,
          type: 'event',
          connections,
        };
      }

      case 'lore': {
        const lore = getLoreEntry(selectedElementId);
        if (!lore) return null;

        // Related characters
        lore.relatedCharacterIds.forEach((charId) => {
          const char = getCharacter(charId);
          if (char) {
            connections.push({
              type: 'character',
              id: char.id,
              name: char.name,
              relationship: 'Related',
            });
          }
        });

        // Related locations
        lore.relatedLocationIds.forEach((locId) => {
          const loc = getLocation(locId);
          if (loc) {
            connections.push({
              type: 'location',
              id: loc.id,
              name: loc.name,
              relationship: 'Related',
            });
          }
        });

        // Related events
        lore.relatedEventIds.forEach((eventId) => {
          const event = getEvent(eventId);
          if (event) {
            connections.push({
              type: 'event',
              id: event.id,
              name: event.title,
              relationship: 'Related',
            });
          }
        });

        return {
          id: lore.id,
          name: lore.title,
          type: 'lore',
          connections,
        };
      }

      case 'idea': {
        const idea = getIdeaCard(selectedElementId);
        if (!idea) return null;

        // Related characters
        idea.relatedCharacterIds.forEach((charId) => {
          const char = getCharacter(charId);
          if (char) {
            connections.push({
              type: 'character',
              id: char.id,
              name: char.name,
              relationship: 'Related',
            });
          }
        });

        // Related locations
        idea.relatedLocationIds.forEach((locId) => {
          const loc = getLocation(locId);
          if (loc) {
            connections.push({
              type: 'location',
              id: loc.id,
              name: loc.name,
              relationship: 'Related',
            });
          }
        });

        return {
          id: idea.id,
          name: idea.title,
          type: 'idea',
          connections,
        };
      }

      default:
        return null;
    }
  }, [
    selectedType,
    selectedElementId,
    getCharacter,
    getLocation,
    getEvent,
    getLoreEntry,
    getIdeaCard,
    getRelationshipsByCharacter,
    characters,
    locations,
    events,
    loreEntries,
    ideaCards,
  ]);

  const connectionsByType = useMemo(() => {
    if (!selectedElement) return {} as Record<ElementType, Array<{ id: string; type: ElementType; name: string; relationship?: string }>>;
    return selectedElement.connections.reduce((acc, conn) => {
      if (!acc[conn.type]) acc[conn.type] = [];
      acc[conn.type].push(conn);
      return acc;
    }, {} as Record<ElementType, Array<{ id: string; type: ElementType; name: string; relationship?: string }>>);
  }, [selectedElement]);

  const hasAnyData =
    characters.length > 0 ||
    locations.length > 0 ||
    events.length > 0 ||
    loreEntries.length > 0 ||
    ideaCards.length > 0;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] lg:min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="p-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Network className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-800">Connections</h1>
              <p className="text-sm text-stone-500">
                Explore how your story elements connect
              </p>
            </div>
          </div>

          {hasAnyData && (
            <div className="flex flex-wrap items-center gap-4">
              <Tabs
                value={selectedType}
                onValueChange={(v) => {
                  setSelectedType(v as ElementType);
                  setSelectedElementId('');
                }}
              >
                <TabsList>
                  <TabsTrigger value="character" disabled={characters.length === 0}>
                    <Users className="w-4 h-4 mr-1" />
                    Characters
                  </TabsTrigger>
                  <TabsTrigger value="location" disabled={locations.length === 0}>
                    <MapPin className="w-4 h-4 mr-1" />
                    Locations
                  </TabsTrigger>
                  <TabsTrigger value="event" disabled={events.length === 0}>
                    <Clock className="w-4 h-4 mr-1" />
                    Events
                  </TabsTrigger>
                  <TabsTrigger value="lore" disabled={loreEntries.length === 0}>
                    <BookMarked className="w-4 h-4 mr-1" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="idea" disabled={ideaCards.length === 0}>
                    <Lightbulb className="w-4 h-4 mr-1" />
                    Ideas
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {elements.length > 0 && (
                <Select value={selectedElementId} onValueChange={setSelectedElementId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder={`Select a ${selectedType}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {elements.map((el) => (
                      <SelectItem key={el.id} value={el.id}>
                        {el.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-5xl mx-auto">
        {!hasAnyData ? (
          <div className="text-center py-16">
            <div className="inline-flex p-4 bg-purple-100 rounded-full mb-4">
              <Network className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-stone-800 mb-2">
              No story elements yet
            </h3>
            <p className="text-stone-500 max-w-md mx-auto">
              Create characters, locations, events, lore, or ideas to see how they connect.
            </p>
          </div>
        ) : !selectedElement ? (
          <div className="text-center py-16">
            <div className="inline-flex p-4 bg-stone-100 rounded-full mb-4">
              <LinkIcon className="w-8 h-8 text-stone-500" />
            </div>
            <h3 className="text-lg font-medium text-stone-800 mb-2">
              Select an element
            </h3>
            <p className="text-stone-500 max-w-md mx-auto">
              Choose a {selectedType} from the dropdown above to explore its connections.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selected Element */}
            <Card className={cn('border-2', typeBgColors[selectedElement.type])}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = typeIcons[selectedElement.type];
                    return (
                      <div className={cn('p-3 rounded-xl', typeColors[selectedElement.type])}>
                        <Icon className="w-6 h-6" />
                      </div>
                    );
                  })()}
                  <div>
                    <p className="text-sm text-stone-500 capitalize">
                      {selectedElement.type}
                    </p>
                    <CardTitle className="text-xl">{selectedElement.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-stone-600">
                  {selectedElement.connections.length === 0
                    ? 'No connections yet. Link this element to others to see relationships.'
                    : `${selectedElement.connections.length} connection${
                        selectedElement.connections.length === 1 ? '' : 's'
                      } found`}
                </p>
              </CardContent>
            </Card>

            {/* Connections by Type */}
            {Object.entries(connectionsByType).map(([type, connections]) => {
              const Icon = typeIcons[type as ElementType];
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-stone-500" />
                    <h3 className="font-medium text-stone-700 capitalize">
                      {type}s ({connections.length})
                    </h3>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {connections.map((conn, i) => (
                      <Card
                        key={`${conn.type}-${conn.id}-${i}`}
                        className={cn(
                          'cursor-pointer hover:shadow-md transition-shadow',
                          typeBgColors[conn.type]
                        )}
                        onClick={() => {
                          setSelectedType(conn.type);
                          setSelectedElementId(conn.id);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={cn('p-2 rounded-lg', typeColors[conn.type])}>
                              {(() => {
                                const ConnIcon = typeIcons[conn.type];
                                return <ConnIcon className="w-4 h-4" />;
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-stone-800 truncate">
                                {conn.name}
                              </p>
                              {conn.relationship && (
                                <p className="text-xs text-stone-500">
                                  {conn.relationship}
                                </p>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-stone-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
