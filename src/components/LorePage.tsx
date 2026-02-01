'use client';

/**
 * LorePage.tsx
 * 
 * The lore/worldbuilding page for documenting fictional world details. Writers can:
 * - Create categorized lore entries (magic systems, politics, history, etc.)
 * - Tag entries for easy filtering
 * - Link lore to characters, locations, and events
 * 
 * Layout: Master-detail pattern with category filters and a detail view.
 */

import { useState } from 'react';
import { useStoryBoardStore } from '@/lib/store';
import { LoreEntry } from '@/lib/types';
import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  BookMarked,
  Sparkles,
  Shield,
  Scroll,
  Cpu,
  Users,
  Building,
  Globe,
  Heart,
  HelpCircle,
} from 'lucide-react';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface LorePageProps {
  storyId: string;
}

/** Icons for each lore category */
const categoryIcons: Record<LoreEntry['category'], React.ComponentType<{ className?: string }>> = {
  'magic-system': Sparkles,
  politics: Shield,
  history: Scroll,
  technology: Cpu,
  species: Users,
  organization: Building,
  culture: Globe,
  religion: Heart,
  other: HelpCircle,
};

/** Color scheme for category badges */
const categoryColors: Record<LoreEntry['category'], string> = {
  'magic-system': 'bg-purple-100 text-purple-700',
  politics: 'bg-red-100 text-red-700',
  history: 'bg-amber-100 text-amber-700',
  technology: 'bg-blue-100 text-blue-700',
  species: 'bg-green-100 text-green-700',
  organization: 'bg-stone-100 text-stone-700',
  culture: 'bg-pink-100 text-pink-700',
  religion: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 text-gray-700',
};

/** Human-readable labels for categories */
const categoryLabels: Record<LoreEntry['category'], string> = {
  'magic-system': 'Magic System',
  politics: 'Politics',
  history: 'History',
  technology: 'Technology',
  species: 'Species',
  organization: 'Organization',
  culture: 'Culture',
  religion: 'Religion',
  other: 'Other',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LorePage({ storyId }: LorePageProps) {
  // Get store actions and data
  const {
    getLoreEntriesByStory,
    addLoreEntry,
    updateLoreEntry,
    deleteLoreEntry,
    getCharactersByStory,
    getLocationsByStory,
    getEventsByStory,
  } = useStoryBoardStore();

  // Fetch related data
  const loreEntries = getLoreEntriesByStory(storyId);
  const characters = getCharactersByStory(storyId);
  const locations = getLocationsByStory(storyId);
  const events = getEventsByStory(storyId);

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LoreEntry['category'] | 'all'>('all');
  const [selectedEntry, setSelectedEntry] = useState<LoreEntry | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LoreEntry | null>(null);

  const categories = Object.keys(categoryLabels) as LoreEntry['category'][];

  // Filter entries by search and category
  const filteredEntries = loreEntries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handler: Create entry
  const handleCreateEntry = (data: Omit<LoreEntry, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => {
    const newEntry = addLoreEntry({ ...data, storyId });
    setIsCreateOpen(false);
    setSelectedEntry(newEntry);
  };

  // Handler: Update entry
  const handleUpdateEntry = (data: Omit<LoreEntry, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => {
    if (editingEntry) {
      updateLoreEntry(editingEntry.id, data);
      setEditingEntry(null);
      if (selectedEntry?.id === editingEntry.id) {
        setSelectedEntry({ ...selectedEntry, ...data } as LoreEntry);
      }
    }
  };

  // Count entries per category for filter badges
  const entriesByCategory = categories.reduce((acc, cat) => {
    acc[cat] = loreEntries.filter((e) => e.category === cat).length;
    return acc;
  }, {} as Record<LoreEntry['category'], number>);

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex">
      {/* ------------------------------------------------------------------ */}
      {/* LEFT SIDEBAR: Lore Entry List */}
      {/* ------------------------------------------------------------------ */}
      <div className="w-full lg:w-96 border-r border-stone-200 bg-white/80 flex flex-col">
        {/* Header with search and category filters */}
        <div className="p-4 border-b border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-stone-800">Lore Builder</h1>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Search lore..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-stone-50 border-stone-200"
            />
          </div>

          {/* Category Filter Badges */}
          <div className="flex flex-wrap gap-1">
            <Badge
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors',
                selectedCategory === 'all' && 'bg-amber-600'
              )}
              onClick={() => setSelectedCategory('all')}
            >
              All ({loreEntries.length})
            </Badge>
            {categories.map((cat) => {
              const count = entriesByCategory[cat];
              if (count === 0) return null;
              const Icon = categoryIcons[cat];
              return (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer transition-colors gap-1',
                    selectedCategory === cat ? categoryColors[cat] : ''
                  )}
                  onClick={() => setSelectedCategory(cat)}
                >
                  <Icon className="w-3 h-3" />
                  {categoryLabels[cat]} ({count})
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Entry List */}
        <ScrollArea className="flex-1">
          {filteredEntries.length === 0 ? (
            <div className="p-4 text-center text-stone-500">
              {searchQuery || selectedCategory !== 'all'
                ? 'No lore entries found'
                : 'No lore entries yet'}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredEntries.map((entry) => {
                const Icon = categoryIcons[entry.category];
                return (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={cn(
                      'w-full p-3 rounded-lg text-left transition-colors',
                      selectedEntry?.id === entry.id
                        ? 'bg-amber-100'
                        : 'hover:bg-stone-100'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('p-2 rounded-lg shrink-0', categoryColors[entry.category])}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-800 truncate">
                          {entry.title}
                        </p>
                        <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                          {entry.content}
                        </p>
                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT PANEL: Lore Details (desktop only) */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden lg:flex flex-1 flex-col bg-gradient-to-br from-stone-50 to-amber-50">
        {selectedEntry ? (
          <LoreDetails
            entry={selectedEntry}
            characters={characters}
            locations={locations}
            events={events}
            onEdit={() => setEditingEntry(selectedEntry)}
            onDelete={() => {
              deleteLoreEntry(selectedEntry.id);
              setSelectedEntry(null);
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
                <BookMarked className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-stone-800 mb-2">
                Select a lore entry
              </h3>
              <p className="text-stone-500 max-w-xs">
                Choose an entry from the list to view details, or create a new one.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* DIALOGS */}
      {/* ------------------------------------------------------------------ */}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <LoreDialog
          characters={characters}
          locations={locations}
          events={events}
          onClose={() => setIsCreateOpen(false)}
          onSave={handleCreateEntry}
        />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        {editingEntry && (
          <LoreDialog
            entry={editingEntry}
            characters={characters}
            locations={locations}
            events={events}
            onClose={() => setEditingEntry(null)}
            onSave={handleUpdateEntry}
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
 * LoreDetails - Displays the full content of a lore entry.
 */
function LoreDetails({
  entry,
  characters,
  locations,
  events,
  onEdit,
  onDelete,
}: {
  entry: LoreEntry;
  characters: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  events: { id: string; title: string }[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = categoryIcons[entry.category];
  
  // Get related elements
  const relatedCharacters = characters.filter((c) =>
    entry.relatedCharacterIds.includes(c.id)
  );
  const relatedLocations = locations.filter((l) =>
    entry.relatedLocationIds.includes(l.id)
  );
  const relatedEvents = events.filter((e) =>
    entry.relatedEventIds.includes(e.id)
  );

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('p-4 rounded-xl', categoryColors[entry.category])}>
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-800">{entry.title}</h1>
              <Badge className={cn('mt-1', categoryColors[entry.category])}>
                {categoryLabels[entry.category]}
              </Badge>
            </div>
          </div>
          {/* Actions */}
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

        {/* Tags */}
        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="border-stone-300">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Content */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">
              {entry.content}
            </p>
          </CardContent>
        </Card>

        {/* Connected Elements */}
        {(relatedCharacters.length > 0 ||
          relatedLocations.length > 0 ||
          relatedEvents.length > 0) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">
                Connected Elements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {relatedCharacters.length > 0 && (
                <div>
                  <p className="text-xs text-stone-400 mb-1">Characters</p>
                  <div className="flex flex-wrap gap-1">
                    {relatedCharacters.map((char) => (
                      <Badge key={char.id} variant="secondary">
                        {char.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {relatedLocations.length > 0 && (
                <div>
                  <p className="text-xs text-stone-400 mb-1">Locations</p>
                  <div className="flex flex-wrap gap-1">
                    {relatedLocations.map((loc) => (
                      <Badge key={loc.id} variant="secondary">
                        {loc.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {relatedEvents.length > 0 && (
                <div>
                  <p className="text-xs text-stone-400 mb-1">Events</p>
                  <div className="flex flex-wrap gap-1">
                    {relatedEvents.map((event) => (
                      <Badge key={event.id} variant="secondary">
                        {event.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

/**
 * LoreDialog - Form for creating/editing lore entries.
 * Includes tabs to link characters, locations, and events.
 */
function LoreDialog({
  entry,
  characters,
  locations,
  events,
  onClose,
  onSave,
}: {
  entry?: LoreEntry;
  characters: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  events: { id: string; title: string }[];
  onClose: () => void;
  onSave: (data: Omit<LoreEntry, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => void;
}) {
  // Form state
  const [title, setTitle] = useState(entry?.title || '');
  const [category, setCategory] = useState<LoreEntry['category']>(entry?.category || 'other');
  const [content, setContent] = useState(entry?.content || '');
  const [tags, setTags] = useState(entry?.tags.join(', ') || '');
  const [relatedCharacterIds, setRelatedCharacterIds] = useState<string[]>(
    entry?.relatedCharacterIds || []
  );
  const [relatedLocationIds, setRelatedLocationIds] = useState<string[]>(
    entry?.relatedLocationIds || []
  );
  const [relatedEventIds, setRelatedEventIds] = useState<string[]>(
    entry?.relatedEventIds || []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onSave({
      title: title.trim(),
      category,
      content: content.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      relatedCharacterIds,
      relatedLocationIds,
      relatedEventIds,
    });
  };

  return (
    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{entry ? 'Edit Lore Entry' : 'Create Lore Entry'}</DialogTitle>
        <DialogDescription>
          Add details about your world&apos;s lore, systems, and background.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Entry title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as LoreEntry['category'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="content">Content *</Label>
          <Textarea
            id="content"
            placeholder="Describe this lore element in detail..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            required
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            placeholder="Ancient, Forbidden, Elemental..."
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        {/* Related Elements Tabs */}
        <Tabs defaultValue="characters" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="characters" className="flex-1">Characters</TabsTrigger>
            <TabsTrigger value="locations" className="flex-1">Locations</TabsTrigger>
            <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
          </TabsList>
          <TabsContent value="characters" className="mt-2">
            <div className="flex flex-wrap gap-2 p-2 border rounded-lg max-h-32 overflow-y-auto">
              {characters.length === 0 ? (
                <p className="text-sm text-stone-400">No characters yet</p>
              ) : (
                characters.map((char) => (
                  <Badge
                    key={char.id}
                    variant={relatedCharacterIds.includes(char.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() =>
                      setRelatedCharacterIds((prev) =>
                        prev.includes(char.id)
                          ? prev.filter((id) => id !== char.id)
                          : [...prev, char.id]
                      )
                    }
                  >
                    {char.name}
                  </Badge>
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="locations" className="mt-2">
            <div className="flex flex-wrap gap-2 p-2 border rounded-lg max-h-32 overflow-y-auto">
              {locations.length === 0 ? (
                <p className="text-sm text-stone-400">No locations yet</p>
              ) : (
                locations.map((loc) => (
                  <Badge
                    key={loc.id}
                    variant={relatedLocationIds.includes(loc.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() =>
                      setRelatedLocationIds((prev) =>
                        prev.includes(loc.id)
                          ? prev.filter((id) => id !== loc.id)
                          : [...prev, loc.id]
                      )
                    }
                  >
                    {loc.name}
                  </Badge>
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="events" className="mt-2">
            <div className="flex flex-wrap gap-2 p-2 border rounded-lg max-h-32 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-sm text-stone-400">No events yet</p>
              ) : (
                events.map((event) => (
                  <Badge
                    key={event.id}
                    variant={relatedEventIds.includes(event.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() =>
                      setRelatedEventIds((prev) =>
                        prev.includes(event.id)
                          ? prev.filter((id) => id !== event.id)
                          : [...prev, event.id]
                      )
                    }
                  >
                    {event.title}
                  </Badge>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
            {entry ? 'Save Changes' : 'Create Entry'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
