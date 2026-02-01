'use client';

/**
 * CharactersPage.tsx
 * 
 * The character management page. Writers can:
 * - Create and edit characters with rich details (name, role, appearance, etc.)
 * - View character profiles with personality, motivations, goals, and flaws
 * - Define relationships between characters
 * - Link characters to locations and events
 * 
 * Layout: Master-detail pattern with a character list sidebar and a detail view.
 */

import { useState } from 'react';
import { useStoryBoardStore } from '@/lib/store';
import { Character, CharacterRelationship } from '@/lib/types';
import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Icons
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  User,
  Heart,
  Target,
  AlertTriangle,
  Sparkles,
  X,
  Link as LinkIcon,
} from 'lucide-react';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface CharactersPageProps {
  storyId: string;
}

/** Color scheme for character role badges */
const roleColors: Record<Character['role'], string> = {
  protagonist: 'bg-amber-100 text-amber-700',
  antagonist: 'bg-red-100 text-red-700',
  supporting: 'bg-blue-100 text-blue-700',
  minor: 'bg-stone-100 text-stone-700',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CharactersPage({ storyId }: CharactersPageProps) {
  // Get store actions and data
  const {
    getCharactersByStory,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    getRelationshipsByCharacter,
    addRelationship,
    deleteRelationship,
    getLocationsByStory,
    getEventsByStory,
  } = useStoryBoardStore();

  // Fetch all related data for this story
  const characters = getCharactersByStory(storyId);
  const locations = getLocationsByStory(storyId);
  const events = getEventsByStory(storyId);

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isRelationshipOpen, setIsRelationshipOpen] = useState(false);

  // Filter characters by search query (name, role, or personality traits)
  const filteredCharacters = characters.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.personality.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handler: Create a new character
  const handleCreateCharacter = (data: Omit<Character, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => {
    const newCharacter = addCharacter({ ...data, storyId });
    setIsCreateOpen(false);
    setSelectedCharacter(newCharacter);
  };

  // Handler: Update an existing character
  const handleUpdateCharacter = (data: Omit<Character, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => {
    if (editingCharacter) {
      updateCharacter(editingCharacter.id, data);
      setEditingCharacter(null);
      // Keep the detail view in sync
      if (selectedCharacter?.id === editingCharacter.id) {
        setSelectedCharacter({ ...selectedCharacter, ...data } as Character);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex">
      {/* ------------------------------------------------------------------ */}
      {/* LEFT SIDEBAR: Character List */}
      {/* ------------------------------------------------------------------ */}
      <div className="w-full lg:w-80 border-r border-stone-200 bg-white/80 flex flex-col">
        {/* Header with search and create button */}
        <div className="p-4 border-b border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-stone-800">Characters</h1>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search characters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-stone-50 border-stone-200"
            />
          </div>
        </div>

        {/* Character list */}
        <ScrollArea className="flex-1">
          {filteredCharacters.length === 0 ? (
            <div className="p-4 text-center text-stone-500">
              {searchQuery ? 'No characters found' : 'No characters yet'}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => setSelectedCharacter(character)}
                  className={cn(
                    'w-full p-3 rounded-lg text-left transition-colors',
                    selectedCharacter?.id === character.id
                      ? 'bg-amber-100'
                      : 'hover:bg-stone-100'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-medium">
                      {character.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 truncate">
                        {character.name}
                      </p>
                      <Badge className={cn('text-xs', roleColors[character.role])}>
                        {character.role}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT PANEL: Character Details (desktop only) */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden lg:flex flex-1 flex-col bg-gradient-to-br from-stone-50 to-amber-50">
        {selectedCharacter ? (
          <CharacterDetails
            character={selectedCharacter}
            characters={characters}
            locations={locations}
            events={events}
            relationships={getRelationshipsByCharacter(selectedCharacter.id)}
            onEdit={() => setEditingCharacter(selectedCharacter)}
            onDelete={() => {
              deleteCharacter(selectedCharacter.id);
              setSelectedCharacter(null);
            }}
            onAddRelationship={() => setIsRelationshipOpen(true)}
            onDeleteRelationship={deleteRelationship}
          />
        ) : (
          // Empty state when no character is selected
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex p-4 bg-amber-100 rounded-full mb-4">
                <User className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-medium text-stone-800 mb-2">
                Select a character
              </h3>
              <p className="text-stone-500 max-w-xs">
                Choose a character from the list to view their details, or create a new one.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* DIALOGS */}
      {/* ------------------------------------------------------------------ */}

      {/* Create Character Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <CharacterDialog
          onClose={() => setIsCreateOpen(false)}
          onSave={handleCreateCharacter}
        />
      </Dialog>

      {/* Edit Character Dialog */}
      <Dialog open={!!editingCharacter} onOpenChange={() => setEditingCharacter(null)}>
        {editingCharacter && (
          <CharacterDialog
            character={editingCharacter}
            onClose={() => setEditingCharacter(null)}
            onSave={handleUpdateCharacter}
          />
        )}
      </Dialog>

      {/* Relationship Dialog */}
      <Dialog open={isRelationshipOpen} onOpenChange={setIsRelationshipOpen}>
        {selectedCharacter && (
          <RelationshipDialog
            storyId={storyId}
            character={selectedCharacter}
            characters={characters}
            onClose={() => setIsRelationshipOpen(false)}
            onSave={(data) => {
              addRelationship(data);
              setIsRelationshipOpen(false);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

/**
 * CharacterDetails - Displays the full profile of a selected character.
 * Shows appearance, traits, relationships, linked locations/events, and notes.
 */
function CharacterDetails({
  character,
  characters,
  locations,
  events,
  relationships,
  onEdit,
  onDelete,
  onAddRelationship,
  onDeleteRelationship,
}: {
  character: Character;
  characters: Character[];
  locations: { id: string; name: string }[];
  events: { id: string; title: string }[];
  relationships: CharacterRelationship[];
  onEdit: () => void;
  onDelete: () => void;
  onAddRelationship: () => void;
  onDeleteRelationship: (id: string) => void;
}) {
  // Get linked locations and events
  const characterLocations = locations.filter((l) =>
    character.locationIds.includes(l.id)
  );
  const characterEvents = events.filter((e) =>
    character.eventIds.includes(e.id)
  );

  // Helper: Get the "other" character in a relationship
  const getRelatedCharacter = (relationship: CharacterRelationship) => {
    const relatedId =
      relationship.character1Id === character.id
        ? relationship.character2Id
        : relationship.character1Id;
    return characters.find((c) => c.id === relatedId);
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        {/* Header: Avatar, Name, Role, Actions */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 text-2xl font-bold">
              {character.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-800">{character.name}</h1>
              <Badge className={cn('mt-1', roleColors[character.role])}>
                {character.role}
              </Badge>
            </div>
          </div>
          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Appearance Card */}
        {character.appearance && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-stone-700">{character.appearance}</p>
            </CardContent>
          </Card>
        )}

        {/* Traits Grid: Personality, Motivations, Goals, Flaws */}
        <div className="grid md:grid-cols-2 gap-4">
          {character.personality.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <CardTitle className="text-sm font-medium text-stone-500">
                    Personality
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {character.personality.map((trait) => (
                    <Badge key={trait} variant="secondary">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {character.motivations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <CardTitle className="text-sm font-medium text-stone-500">
                    Motivations
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {character.motivations.map((motivation) => (
                    <Badge key={motivation} variant="secondary">
                      {motivation}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {character.goals.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-600" />
                  <CardTitle className="text-sm font-medium text-stone-500">
                    Goals
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {character.goals.map((goal) => (
                    <Badge key={goal} variant="secondary">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {character.flaws.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <CardTitle className="text-sm font-medium text-stone-500">
                    Flaws
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {character.flaws.map((flaw) => (
                    <Badge key={flaw} variant="secondary">
                      {flaw}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Backstory Card */}
        {character.backstory && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">
                Backstory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-stone-700 whitespace-pre-wrap">{character.backstory}</p>
            </CardContent>
          </Card>
        )}

        {/* Relationships Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-purple-600" />
                <CardTitle className="text-sm font-medium text-stone-500">
                  Relationships
                </CardTitle>
              </div>
              <Button size="sm" variant="ghost" onClick={onAddRelationship}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {relationships.length === 0 ? (
              <p className="text-sm text-stone-400">No relationships defined</p>
            ) : (
              <div className="space-y-2">
                {relationships.map((rel) => {
                  const related = getRelatedCharacter(rel);
                  if (!related) return null;
                  return (
                    <div
                      key={rel.id}
                      className="flex items-center justify-between p-2 bg-stone-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 text-sm font-medium">
                          {related.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-stone-800 text-sm">
                            {related.name}
                          </p>
                          <p className="text-xs text-stone-500">
                            {rel.type}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => onDeleteRelationship(rel.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connected Locations & Events */}
        <div className="grid md:grid-cols-2 gap-4">
          {characterLocations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-stone-500">
                  Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {characterLocations.map((loc) => (
                    <Badge key={loc.id} variant="outline">
                      {loc.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {characterEvents.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-stone-500">
                  Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {characterEvents.map((event) => (
                    <Badge key={event.id} variant="outline">
                      {event.title}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Notes Card */}
        {character.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-stone-700 whitespace-pre-wrap">{character.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

/**
 * CharacterDialog - Form dialog for creating/editing a character.
 * Collects all character data: name, role, appearance, traits, backstory, notes.
 */
function CharacterDialog({
  character,
  onClose,
  onSave,
}: {
  character?: Character;
  onClose: () => void;
  onSave: (data: Omit<Character, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => void;
}) {
  // Form state - pre-fill if editing
  const [name, setName] = useState(character?.name || '');
  const [role, setRole] = useState<Character['role']>(character?.role || 'supporting');
  const [appearance, setAppearance] = useState(character?.appearance || '');
  const [personality, setPersonality] = useState((character?.personality || []).join(', '));
  const [motivations, setMotivations] = useState((character?.motivations || []).join(', '));
  const [goals, setGoals] = useState((character?.goals || []).join(', '));
  const [flaws, setFlaws] = useState((character?.flaws || []).join(', '));
  const [backstory, setBackstory] = useState(character?.backstory || '');
  const [notes, setNotes] = useState(character?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Helper to parse comma-separated values into array
    const parseList = (str: string) =>
      str
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    onSave({
      name: name.trim(),
      role,
      appearance: appearance.trim() || undefined,
      personality: parseList(personality),
      motivations: parseList(motivations),
      goals: parseList(goals),
      flaws: parseList(flaws),
      backstory: backstory.trim() || undefined,
      notes: notes.trim() || undefined,
      locationIds: character?.locationIds || [],
      eventIds: character?.eventIds || [],
      relationshipIds: character?.relationshipIds || [],
      tags: character?.tags || [],
    });
  };

  return (
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{character ? 'Edit Character' : 'Create Character'}</DialogTitle>
        <DialogDescription>
          Define who this character is and how they fit into your story.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Role */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Character name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Character['role'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="protagonist">Protagonist</SelectItem>
                <SelectItem value="antagonist">Antagonist</SelectItem>
                <SelectItem value="supporting">Supporting</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Appearance */}
        <div className="space-y-2">
          <Label htmlFor="appearance">Appearance</Label>
          <Textarea
            id="appearance"
            placeholder="Physical description..."
            value={appearance}
            onChange={(e) => setAppearance(e.target.value)}
            rows={2}
          />
        </div>

        {/* Personality */}
        <div className="space-y-2">
          <Label htmlFor="personality">Personality Traits (comma-separated)</Label>
          <Input
            id="personality"
            placeholder="Brave, Curious, Stubborn..."
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
          />
        </div>

        {/* Motivations */}
        <div className="space-y-2">
          <Label htmlFor="motivations">Motivations (comma-separated)</Label>
          <Input
            id="motivations"
            placeholder="Revenge, Love, Justice..."
            value={motivations}
            onChange={(e) => setMotivations(e.target.value)}
          />
        </div>

        {/* Goals */}
        <div className="space-y-2">
          <Label htmlFor="goals">Goals (comma-separated)</Label>
          <Input
            id="goals"
            placeholder="Find the treasure, Save the world..."
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
          />
        </div>

        {/* Flaws */}
        <div className="space-y-2">
          <Label htmlFor="flaws">Flaws (comma-separated)</Label>
          <Input
            id="flaws"
            placeholder="Impulsive, Distrustful, Arrogant..."
            value={flaws}
            onChange={(e) => setFlaws(e.target.value)}
          />
        </div>

        {/* Backstory */}
        <div className="space-y-2">
          <Label htmlFor="backstory">Backstory</Label>
          <Textarea
            id="backstory"
            placeholder="Their history and background..."
            value={backstory}
            onChange={(e) => setBackstory(e.target.value)}
            rows={3}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {/* Actions */}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
            {character ? 'Save Changes' : 'Create Character'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

/**
 * RelationshipDialog - Form to create a relationship between two characters.
 */
function RelationshipDialog({
  storyId,
  character,
  characters,
  onClose,
  onSave,
}: {
  storyId: string;
  character: Character;
  characters: Character[];
  onClose: () => void;
  onSave: (data: Omit<CharacterRelationship, 'id' | 'createdAt' | 'updatedAt'>) => void;
}) {
  const [relatedCharacterId, setRelatedCharacterId] = useState('');
  const [relationshipType, setRelationshipType] = useState('');

  // Exclude the current character from the dropdown
  const otherCharacters = characters.filter((c) => c.id !== character.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!relatedCharacterId || !relationshipType.trim()) return;

    onSave({
      storyId,
      character1Id: character.id,
      character2Id: relatedCharacterId,
      type: relationshipType.trim(),
    });
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Relationship</DialogTitle>
        <DialogDescription>
          Define how {character.name} relates to another character.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Related Character Select */}
        <div className="space-y-2">
          <Label>Related Character</Label>
          <Select value={relatedCharacterId} onValueChange={setRelatedCharacterId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a character" />
            </SelectTrigger>
            <SelectContent>
              {otherCharacters.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Relationship Type */}
        <div className="space-y-2">
          <Label htmlFor="relType">Relationship Type</Label>
          <Input
            id="relType"
            placeholder="Friend, Enemy, Sibling, Mentor..."
            value={relationshipType}
            onChange={(e) => setRelationshipType(e.target.value)}
          />
        </div>

        {/* Actions */}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
            Add Relationship
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
