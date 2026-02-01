/**
 * TagsPage.tsx - Manage custom tags for organizing story elements
 * 
 * Features:
 * - Create, edit, delete tags
 * - Color picker for tags
 * - See usage across all story elements
 */

'use client';

import { useState } from 'react';
import { useStoryBoardStore } from '@/lib/store';
import { Tag } from '@/types';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// Icons
import {
  Plus,
  Tag as TagIcon,
  Trash2,
  Edit2,
  FileText,
  Users,
  MapPin,
  Lightbulb,
  Clock,
  BookMarked,
} from 'lucide-react';

// =============================================================================
// CONSTANTS
// =============================================================================

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#78716c', // stone
  '#64748b', // slate
];

// =============================================================================
// COMPONENT
// =============================================================================

interface TagsPageProps {
  storyId: string;
}

export function TagsPage({ storyId }: TagsPageProps) {
  const {
    getTagsByStory,
    addTag,
    updateTag,
    deleteTag,
    getChaptersByStory,
    getCharactersByStory,
    getLocationsByStory,
    getIdeaCardsByStory,
    getEventsByStory,
    getLoreEntriesByStory,
  } = useStoryBoardStore();

  const tags = getTagsByStory(storyId);
  const chapters = getChaptersByStory(storyId);
  const characters = getCharactersByStory(storyId);
  const locations = getLocationsByStory(storyId);
  const ideas = getIdeaCardsByStory(storyId);
  const events = getEventsByStory(storyId);
  const lore = getLoreEntriesByStory(storyId);

  // State
  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  // Count usage across all entity types
  const getTagUsage = (tagName: string) => {
    return {
      chapters: chapters.filter((c) => c.tags?.includes(tagName)).length,
      characters: characters.filter((c) => c.tags?.includes(tagName)).length,
      locations: locations.filter((l) => l.tags?.includes(tagName)).length,
      ideas: ideas.filter((i) => i.tags?.includes(tagName)).length,
      events: events.filter((e) => e.tags?.includes(tagName)).length,
      lore: lore.filter((l) => l.tags?.includes(tagName)).length,
    };
  };

  const getTotalUsage = (tagName: string) => {
    const usage = getTagUsage(tagName);
    return Object.values(usage).reduce((a, b) => a + b, 0);
  };

  // Create new tag
  const handleCreate = () => {
    if (!newName.trim()) return;
    
    addTag({
      storyId,
      name: newName.trim(),
      color: newColor,
    });
    
    setNewName('');
    setNewColor(PRESET_COLORS[0]);
    setIsCreating(false);
  };

  // Update tag across all entities
  const handleUpdate = () => {
    if (!editingTag || !newName.trim()) return;
    const store = useStoryBoardStore.getState();
    const oldName = editingTag.name;
    const newNameTrimmed = newName.trim();
    
    // If name changed, update all entities that use this tag
    if (oldName !== newNameTrimmed) {
      // Update chapters
      chapters.forEach((item) => {
        if (item.tags?.includes(oldName)) {
          store.updateChapter(item.id, { 
            tags: item.tags.map((t) => t === oldName ? newNameTrimmed : t) 
          });
        }
      });
      // Update characters
      characters.forEach((item) => {
        if (item.tags?.includes(oldName)) {
          store.updateCharacter(item.id, { 
            tags: item.tags.map((t) => t === oldName ? newNameTrimmed : t) 
          });
        }
      });
      // Update locations
      locations.forEach((item) => {
        if (item.tags?.includes(oldName)) {
          store.updateLocation(item.id, { 
            tags: item.tags.map((t) => t === oldName ? newNameTrimmed : t) 
          });
        }
      });
      // Update ideas
      ideas.forEach((item) => {
        if (item.tags?.includes(oldName)) {
          store.updateIdeaCard(item.id, { 
            tags: item.tags.map((t) => t === oldName ? newNameTrimmed : t) 
          });
        }
      });
      // Update events
      events.forEach((item) => {
        if (item.tags?.includes(oldName)) {
          store.updateEvent(item.id, { 
            tags: item.tags.map((t) => t === oldName ? newNameTrimmed : t) 
          });
        }
      });
      // Update lore
      lore.forEach((item) => {
        if (item.tags?.includes(oldName)) {
          store.updateLoreEntry(item.id, { 
            tags: item.tags.map((t) => t === oldName ? newNameTrimmed : t) 
          });
        }
      });
    }
    
    updateTag(editingTag.id, {
      name: newNameTrimmed,
      color: newColor,
    });
    
    setEditingTag(null);
    setNewName('');
    setNewColor(PRESET_COLORS[0]);
  };

  // Delete tag from all entities
  const handleDelete = (tag: Tag) => {
    if (!confirm(`Delete tag "${tag.name}"? It will be removed from all elements.`)) return;
    const store = useStoryBoardStore.getState();
    const tagName = tag.name;
    
    // Remove from all entities
    chapters.forEach((item) => {
      if (item.tags?.includes(tagName)) {
        store.updateChapter(item.id, { tags: item.tags.filter((t) => t !== tagName) });
      }
    });
    characters.forEach((item) => {
      if (item.tags?.includes(tagName)) {
        store.updateCharacter(item.id, { tags: item.tags.filter((t) => t !== tagName) });
      }
    });
    locations.forEach((item) => {
      if (item.tags?.includes(tagName)) {
        store.updateLocation(item.id, { tags: item.tags.filter((t) => t !== tagName) });
      }
    });
    ideas.forEach((item) => {
      if (item.tags?.includes(tagName)) {
        store.updateIdeaCard(item.id, { tags: item.tags.filter((t) => t !== tagName) });
      }
    });
    events.forEach((item) => {
      if (item.tags?.includes(tagName)) {
        store.updateEvent(item.id, { tags: item.tags.filter((t) => t !== tagName) });
      }
    });
    lore.forEach((item) => {
      if (item.tags?.includes(tagName)) {
        store.updateLoreEntry(item.id, { tags: item.tags.filter((t) => t !== tagName) });
      }
    });
    
    deleteTag(tag.id);
  };

  // Open edit dialog
  const openEdit = (tag: Tag) => {
    setEditingTag(tag);
    setNewName(tag.name);
    setNewColor(tag.color);
  };

  // Usage icons
  const UsageIcons = ({ tagName }: { tagName: string }) => {
    const usage = getTagUsage(tagName);
    const items = [
      { count: usage.chapters, icon: FileText, label: 'chapters', color: 'text-rose-500' },
      { count: usage.characters, icon: Users, label: 'characters', color: 'text-amber-500' },
      { count: usage.locations, icon: MapPin, label: 'locations', color: 'text-blue-500' },
      { count: usage.ideas, icon: Lightbulb, label: 'ideas', color: 'text-yellow-500' },
      { count: usage.events, icon: Clock, label: 'events', color: 'text-purple-500' },
      { count: usage.lore, icon: BookMarked, label: 'lore', color: 'text-green-500' },
    ].filter(item => item.count > 0);

    if (items.length === 0) {
      return <span className="text-stone-400 text-sm">Not used yet</span>;
    }

    return (
      <div className="flex items-center gap-3 flex-wrap">
        {items.map(({ count, icon: Icon, label, color }) => (
          <div key={label} className="flex items-center gap-1 text-sm text-stone-600">
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            <span>{count}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <TagIcon className="w-6 h-6" />
            Tags
          </h1>
          <p className="text-stone-500 mt-1">
            Create custom tags to organize chapters, characters, locations, and more
          </p>
        </div>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-stone-800 hover:bg-stone-700">
              <Plus className="w-4 h-4 mr-2" />
              New Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Tag Name</Label>
                <Input
                  placeholder="e.g., Action, Romance, Flashback..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newColor === color ? 'ring-2 ring-offset-2 ring-stone-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div className="pt-2">
                <Label>Preview</Label>
                <div className="mt-2">
                  <Badge style={{ backgroundColor: newColor, color: 'white' }}>
                    {newName || 'Tag Name'}
                  </Badge>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newName.trim()}>
                Create Tag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center gap-4 text-sm text-stone-500">
        <span>{tags.length} tags</span>
        <Separator orientation="vertical" className="h-4" />
        <span>Apply to chapters, characters, locations, ideas, timeline events, and lore</span>
      </div>

      {/* Tags Grid */}
      {tags.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-stone-400">
            <TagIcon className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-medium">No tags yet</p>
            <p className="text-sm text-center max-w-md mt-1">
              Create tags to organize and filter your story elements.
              Tags can be applied to chapters, characters, locations, ideas, timeline events, and lore.
            </p>
            <Button 
              className="mt-4" 
              variant="outline"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create your first tag
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tags.map((tag) => {
            const total = getTotalUsage(tag.name);
            return (
              <Card key={tag.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge
                        style={{ backgroundColor: tag.color, color: 'white' }}
                        className="text-sm px-3 py-1"
                      >
                        {tag.name}
                      </Badge>
                      <span className="text-xs text-stone-400">
                        {total} {total === 1 ? 'use' : 'uses'}
                      </span>
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEdit(tag)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(tag)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <UsageIcons tagName={tag.name} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tag Name</Label>
              <Input
                placeholder="e.g., Action, Romance, Flashback..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      newColor === color ? 'ring-2 ring-offset-2 ring-stone-400 scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="pt-2">
              <Label>Preview</Label>
              <div className="mt-2">
                <Badge style={{ backgroundColor: newColor, color: 'white' }}>
                  {newName || 'Tag Name'}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTag(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!newName.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TagsPage;
