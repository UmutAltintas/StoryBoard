'use client';

import { useState } from 'react';
import { useStoryBoardStore } from '@/lib/store';
import { IdeaCard, IdeaGroup } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Lightbulb,
  Sparkles,
  MessageSquare,
  HelpCircle,
  FileText,
  Zap,
  FolderPlus,
  Folder,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IdeasPageProps {
  storyId: string;
}

const typeIcons: Record<IdeaCard['type'], React.ComponentType<{ className?: string }>> = {
  scene: Lightbulb,
  'plot-twist': Zap,
  dialogue: MessageSquare,
  question: HelpCircle,
  note: FileText,
  other: Sparkles,
};

const typeColors: Record<IdeaCard['type'], string> = {
  scene: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'plot-twist': 'bg-purple-100 text-purple-700 border-purple-200',
  dialogue: 'bg-blue-100 text-blue-700 border-blue-200',
  question: 'bg-orange-100 text-orange-700 border-orange-200',
  note: 'bg-stone-100 text-stone-700 border-stone-200',
  other: 'bg-pink-100 text-pink-700 border-pink-200',
};

const typeLabels: Record<IdeaCard['type'], string> = {
  scene: 'Scene',
  'plot-twist': 'Plot Twist',
  dialogue: 'Dialogue',
  question: 'Question',
  note: 'Note',
  other: 'Other',
};

const cardColors = [
  { name: 'Default', value: '' },
  { name: 'Yellow', value: 'bg-yellow-50 border-yellow-200' },
  { name: 'Blue', value: 'bg-blue-50 border-blue-200' },
  { name: 'Green', value: 'bg-green-50 border-green-200' },
  { name: 'Purple', value: 'bg-purple-50 border-purple-200' },
  { name: 'Pink', value: 'bg-pink-50 border-pink-200' },
  { name: 'Orange', value: 'bg-orange-50 border-orange-200' },
];

export function IdeasPage({ storyId }: IdeasPageProps) {
  const {
    getIdeaCardsByStory,
    addIdeaCard,
    updateIdeaCard,
    deleteIdeaCard,
    getIdeaGroupsByStory,
    addIdeaGroup,
    getCharactersByStory,
    getLocationsByStory,
  } = useStoryBoardStore();

  const ideaCards = getIdeaCardsByStory(storyId);
  const ideaGroups = getIdeaGroupsByStory(storyId);
  const characters = getCharactersByStory(storyId);
  const locations = getLocationsByStory(storyId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<IdeaCard['type'] | 'all'>('all');
  const [selectedGroup, setSelectedGroup] = useState<string | 'all' | 'ungrouped'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<IdeaCard | null>(null);
  const [isGroupCreateOpen, setIsGroupCreateOpen] = useState(false);

  const filteredCards = ideaCards.filter((card) => {
    const matchesSearch =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || card.type === selectedType;
    const matchesGroup =
      selectedGroup === 'all' ||
      (selectedGroup === 'ungrouped' ? !card.groupId : card.groupId === selectedGroup);
    return matchesSearch && matchesType && matchesGroup;
  });

  const handleCreateCard = (data: Omit<IdeaCard, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => {
    addIdeaCard({
      ...data,
      storyId,
      order: ideaCards.length,
    });
    setIsCreateOpen(false);
  };

  const handleUpdateCard = (data: Omit<IdeaCard, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => {
    if (editingCard) {
      updateIdeaCard(editingCard.id, data);
      setEditingCard(null);
    }
  };

  const handleCreateGroup = (name: string) => {
    addIdeaGroup({
      storyId,
      name,
      order: ideaGroups.length,
    });
    setIsGroupCreateOpen(false);
  };

  const ungroupedCount = ideaCards.filter((c) => !c.groupId).length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] lg:min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="p-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-stone-800">Idea Board</h1>
              <p className="text-sm text-stone-500">Capture and organize your story ideas</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGroupCreateOpen(true)}
              >
                <FolderPlus className="w-4 h-4 mr-1" />
                New Group
              </Button>
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                New Idea
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Search ideas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-stone-50 border-stone-200"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              <Badge
                variant={selectedType === 'all' ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer',
                  selectedType === 'all' && 'bg-amber-600'
                )}
                onClick={() => setSelectedType('all')}
              >
                All Types
              </Badge>
              {(Object.keys(typeLabels) as IdeaCard['type'][]).map((type) => {
                const Icon = typeIcons[type];
                return (
                  <Badge
                    key={type}
                    variant={selectedType === type ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer gap-1',
                      selectedType === type && typeColors[type]
                    )}
                    onClick={() => setSelectedType(type)}
                  >
                    <Icon className="w-3 h-3" />
                    {typeLabels[type]}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Groups Filter */}
          {ideaGroups.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              <Badge
                variant={selectedGroup === 'all' ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer',
                  selectedGroup === 'all' && 'bg-stone-700'
                )}
                onClick={() => setSelectedGroup('all')}
              >
                All Groups
              </Badge>
              <Badge
                variant={selectedGroup === 'ungrouped' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedGroup('ungrouped')}
              >
                Ungrouped ({ungroupedCount})
              </Badge>
              {ideaGroups.map((group) => {
                const count = ideaCards.filter((c) => c.groupId === group.id).length;
                return (
                  <Badge
                    key={group.id}
                    variant={selectedGroup === group.id ? 'default' : 'outline'}
                    className="cursor-pointer gap-1"
                    onClick={() => setSelectedGroup(group.id)}
                  >
                    <Folder className="w-3 h-3" />
                    {group.name} ({count})
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ideas Grid */}
      <div className="p-4 max-w-7xl mx-auto">
        {filteredCards.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex p-4 bg-yellow-100 rounded-full mb-4">
              <Lightbulb className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-medium text-stone-800 mb-2">
              {searchQuery || selectedType !== 'all' || selectedGroup !== 'all'
                ? 'No ideas found'
                : 'No ideas yet'}
            </h3>
            <p className="text-stone-500 max-w-md mx-auto mb-4">
              {searchQuery || selectedType !== 'all' || selectedGroup !== 'all'
                ? 'Try adjusting your filters'
                : 'Capture scenes, plot twists, dialogue snippets, or any sparks of inspiration'}
            </p>
            {!searchQuery && selectedType === 'all' && selectedGroup === 'all' && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Capture Your First Idea
              </Button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCards.map((card) => (
              <IdeaCardComponent
                key={card.id}
                card={card}
                groups={ideaGroups}
                onEdit={() => setEditingCard(card)}
                onDelete={() => deleteIdeaCard(card.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Idea Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <IdeaDialog
          groups={ideaGroups}
          characters={characters}
          locations={locations}
          onClose={() => setIsCreateOpen(false)}
          onSave={handleCreateCard}
        />
      </Dialog>

      {/* Edit Idea Dialog */}
      <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
        {editingCard && (
          <IdeaDialog
            card={editingCard}
            groups={ideaGroups}
            characters={characters}
            locations={locations}
            onClose={() => setEditingCard(null)}
            onSave={handleUpdateCard}
          />
        )}
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog open={isGroupCreateOpen} onOpenChange={setIsGroupCreateOpen}>
        <GroupDialog
          onClose={() => setIsGroupCreateOpen(false)}
          onSave={handleCreateGroup}
        />
      </Dialog>
    </div>
  );
}

function IdeaCardComponent({
  card,
  groups,
  onEdit,
  onDelete,
}: {
  card: IdeaCard;
  groups: IdeaGroup[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = typeIcons[card.type];
  const group = groups.find((g) => g.id === card.groupId);

  return (
    <Card
      className={cn(
        'group hover:shadow-md transition-all cursor-pointer border',
        card.color || 'bg-white'
      )}
      onClick={onEdit}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <Badge className={cn('gap-1', typeColors[card.type])}>
            <Icon className="w-3 h-3" />
            {typeLabels[card.type]}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <h3 className="font-semibold text-stone-800 line-clamp-1">{card.title}</h3>
        <p className="text-sm text-stone-600 line-clamp-3">{card.content}</p>
        {group && (
          <div className="flex items-center gap-1 text-xs text-stone-400">
            <Folder className="w-3 h-3" />
            {group.name}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function IdeaDialog({
  card,
  groups,
  characters,
  locations,
  onClose,
  onSave,
}: {
  card?: IdeaCard;
  groups: IdeaGroup[];
  characters: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  onClose: () => void;
  onSave: (data: Omit<IdeaCard, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => void;
}) {
  const [title, setTitle] = useState(card?.title || '');
  const [content, setContent] = useState(card?.content || '');
  const [type, setType] = useState<IdeaCard['type']>(card?.type || 'note');
  const [groupId, setGroupId] = useState(card?.groupId || '');
  const [color, setColor] = useState(card?.color || '');
  const [relatedCharacterIds, setRelatedCharacterIds] = useState<string[]>(
    card?.relatedCharacterIds || []
  );
  const [relatedLocationIds, setRelatedLocationIds] = useState<string[]>(
    card?.relatedLocationIds || []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onSave({
      title: title.trim(),
      content: content.trim(),
      type,
      groupId: groupId || undefined,
      color: color || undefined,
      relatedCharacterIds,
      relatedLocationIds,
      order: card?.order || 0,
      tags: card?.tags || [],
    });
  };

  return (
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{card ? 'Edit Idea' : 'Capture Idea'}</DialogTitle>
        <DialogDescription>
          Write down your thought before it escapes.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="A brief title for your idea"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as IdeaCard['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {groups.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="group">Group</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="No group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No group</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content *</Label>
          <Textarea
            id="content"
            placeholder="Describe your idea in detail..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Card Color</Label>
          <div className="flex flex-wrap gap-2">
            {cardColors.map((c) => (
              <button
                key={c.name}
                type="button"
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-all',
                  c.value || 'bg-white',
                  color === c.value ? 'ring-2 ring-amber-400 ring-offset-2' : ''
                )}
                onClick={() => setColor(c.value)}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {(characters.length > 0 || locations.length > 0) && (
          <div className="space-y-3">
            <Label>Related Elements</Label>
            {characters.length > 0 && (
              <div>
                <p className="text-xs text-stone-400 mb-1">Characters</p>
                <div className="flex flex-wrap gap-1 p-2 border rounded-lg max-h-24 overflow-y-auto">
                  {characters.map((char) => (
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
                  ))}
                </div>
              </div>
            )}
            {locations.length > 0 && (
              <div>
                <p className="text-xs text-stone-400 mb-1">Locations</p>
                <div className="flex flex-wrap gap-1 p-2 border rounded-lg max-h-24 overflow-y-auto">
                  {locations.map((loc) => (
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
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
            {card ? 'Save Changes' : 'Capture Idea'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function GroupDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Group</DialogTitle>
        <DialogDescription>
          Organize your ideas into groups for better clarity.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="groupName">Group Name</Label>
          <Input
            id="groupName"
            placeholder="e.g., Act 1, Character Arcs, World Details..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
            Create Group
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
