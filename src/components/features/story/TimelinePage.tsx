'use client';

import { useState, useEffect } from 'react';
import { useStoryBoardStore } from '@/lib/store';
import { TimelineEvent, Tag as TagType } from '@/types';
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
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Clock,
  MapPin,
  Users,
  GripVertical,
  Star,
  Circle,
  Dot,
  Tag,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TimelinePageProps {
  storyId: string;
  selectedId?: string;
}

const significanceColors: Record<TimelineEvent['significance'], string> = {
  major: 'border-l-amber-500 bg-amber-50',
  minor: 'border-l-blue-400 bg-blue-50/50',
  background: 'border-l-stone-300 bg-stone-50',
};

const significanceIcons: Record<TimelineEvent['significance'], React.ComponentType<{ className?: string }>> = {
  major: Star,
  minor: Circle,
  background: Dot,
};

export function TimelinePage({ storyId, selectedId }: TimelinePageProps) {
  const {
    getEventsByStory,
    addEvent,
    updateEvent,
    deleteEvent,
    reorderEvents,
    getCharactersByStory,
    getLocationsByStory,
    getTagsByStory,
  } = useStoryBoardStore();

  const events = getEventsByStory(storyId);
  const storyTags = getTagsByStory(storyId);
  const characters = getCharactersByStory(storyId);
  const locations = getLocationsByStory(storyId);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  // Auto-select event when selectedId prop changes (from search)
  useEffect(() => {
    if (selectedId) {
      const event = events.find((e) => e.id === selectedId);
      if (event) {
        setSelectedEvent(event);
      }
    }
  }, [selectedId, events]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = events.findIndex((e) => e.id === active.id);
      const newIndex = events.findIndex((e) => e.id === over.id);
      const newOrder = arrayMove(
        events.map((e) => e.id),
        oldIndex,
        newIndex
      );
      reorderEvents(storyId, newOrder);
    }
  };

  const handleCreateEvent = (data: Omit<TimelineEvent, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => {
    const newEvent = addEvent({
      ...data,
      storyId,
      order: events.length,
    });
    setIsCreateOpen(false);
    setSelectedEvent(newEvent);
  };

  const handleUpdateEvent = (data: Omit<TimelineEvent, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, data);
      setEditingEvent(null);
      if (selectedEvent?.id === editingEvent.id) {
        setSelectedEvent({ ...selectedEvent, ...data } as TimelineEvent);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex">
      {/* Timeline */}
      <div className="w-full lg:w-[500px] border-r border-stone-200 bg-white/80 flex flex-col">
        <div className="p-4 border-b border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-stone-800">Timeline</h1>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Event
            </Button>
          </div>
          <p className="text-sm text-stone-500">
            Drag events to reorder them in your story&apos;s chronology
          </p>
        </div>

        <ScrollArea className="flex-1">
          {events.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex p-4 bg-purple-100 rounded-full mb-4">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-stone-800 mb-2">
                No events yet
              </h3>
              <p className="text-stone-500 max-w-xs mx-auto mb-4">
                Create timeline events to organize your story chronologically
              </p>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Event
              </Button>
            </div>
          ) : (
            <div className="p-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={events.map((e) => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {events.map((event, index) => (
                      <SortableEventCard
                        key={event.id}
                        event={event}
                        index={index}
                        isSelected={selectedEvent?.id === event.id}
                        onClick={() => setSelectedEvent(event)}
                        onEdit={() => setEditingEvent(event)}
                        onDelete={() => {
                          deleteEvent(event.id);
                          if (selectedEvent?.id === event.id) {
                            setSelectedEvent(null);
                          }
                        }}
                        locations={locations}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Event Details */}
      <div className="hidden lg:flex flex-1 flex-col bg-gradient-to-br from-stone-50 to-amber-50">
        {selectedEvent ? (
          <EventDetails
            event={selectedEvent}
            characters={characters}
            locations={locations}
            storyTags={storyTags}
            onEdit={() => setEditingEvent(selectedEvent)}
            onDelete={() => {
              deleteEvent(selectedEvent.id);
              setSelectedEvent(null);
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex p-4 bg-purple-100 rounded-full mb-4">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-stone-800 mb-2">
                Select an event
              </h3>
              <p className="text-stone-500 max-w-xs">
                Choose an event from the timeline to view its details.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <EventDialog
          characters={characters}
          locations={locations}
          storyTags={storyTags}
          onClose={() => setIsCreateOpen(false)}
          onSave={handleCreateEvent}
        />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
        {editingEvent && (
          <EventDialog
            event={editingEvent}
            characters={characters}
            locations={locations}
            storyTags={storyTags}
            onClose={() => setEditingEvent(null)}
            onSave={handleUpdateEvent}
          />
        )}
      </Dialog>
    </div>
  );
}

function SortableEventCard({
  event,
  index,
  isSelected,
  onClick,
  onEdit,
  onDelete,
  locations,
}: {
  event: TimelineEvent;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  locations: { id: string; name: string }[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = significanceIcons[event.significance];
  const location = locations.find((l) => l.id === event.locationId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative pl-8 border-l-4 rounded-lg transition-colors cursor-pointer',
        significanceColors[event.significance],
        isSelected && 'ring-2 ring-amber-400'
      )}
      onClick={onClick}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab"
      >
        <GripVertical className="w-4 h-4 text-stone-400" />
      </div>

      <div className="absolute -left-[13px] top-4 bg-white rounded-full p-1">
        <Icon
          className={cn(
            'w-4 h-4',
            event.significance === 'major' && 'text-amber-500',
            event.significance === 'minor' && 'text-blue-400',
            event.significance === 'background' && 'text-stone-400'
          )}
        />
      </div>

      <Card className="border-0 shadow-none bg-transparent">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-stone-400">#{index + 1}</span>
                {event.date && (
                  <Badge variant="outline" className="text-xs">
                    {event.date}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-stone-800">{event.title}</h3>
              {event.description && (
                <p className="text-sm text-stone-600 line-clamp-2 mt-1">
                  {event.description}
                </p>
              )}
              {location && (
                <div className="flex items-center gap-1 mt-2 text-xs text-stone-500">
                  <MapPin className="w-3 h-3" />
                  {location.name}
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
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
        </CardContent>
      </Card>
    </div>
  );
}

function EventDetails({
  event,
  characters,
  locations,
  storyTags,
  onEdit,
  onDelete,
}: {
  event: TimelineEvent;
  characters: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  storyTags: TagType[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const location = locations.find((l) => l.id === event.locationId);
  const eventCharacters = characters.filter((c) =>
    event.characterIds.includes(c.id)
  );
  const Icon = significanceIcons[event.significance];
  
  // Resolve tag IDs to tag objects
  const resolvedTags = event.tags
    .map((tagId) => storyTags.find((t) => t.id === tagId))
    .filter(Boolean) as TagType[];

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-3 rounded-xl',
                  event.significance === 'major' && 'bg-amber-100',
                  event.significance === 'minor' && 'bg-blue-100',
                  event.significance === 'background' && 'bg-stone-100'
                )}
              >
                <Icon
                  className={cn(
                    'w-6 h-6',
                    event.significance === 'major' && 'text-amber-600',
                    event.significance === 'minor' && 'text-blue-500',
                    event.significance === 'background' && 'text-stone-500'
                  )}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-800">{event.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className={cn(
                      event.significance === 'major' && 'bg-amber-100 text-amber-700',
                      event.significance === 'minor' && 'bg-blue-100 text-blue-700',
                      event.significance === 'background' && 'bg-stone-100 text-stone-700'
                    )}
                  >
                    {event.significance} event
                  </Badge>
                  {event.date && (
                    <Badge variant="outline">{event.date}</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
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

        {/* Description */}
        {event.description && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-stone-700 whitespace-pre-wrap">{event.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Location */}
        {location && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm font-medium text-stone-500">
                  Location
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-sm">
                {location.name}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Characters */}
        {eventCharacters.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <CardTitle className="text-sm font-medium text-stone-500">
                  Involved Characters
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {eventCharacters.map((char) => (
                  <Badge key={char.id} variant="secondary">
                    {char.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {resolvedTags.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {resolvedTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${tag.color}30`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

function EventDialog({
  event,
  characters,
  locations,
  storyTags,
  onClose,
  onSave,
}: {
  event?: TimelineEvent;
  characters: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  storyTags: TagType[];
  onClose: () => void;
  onSave: (data: Omit<TimelineEvent, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => void;
}) {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [date, setDate] = useState(event?.date || '');
  const [locationId, setLocationId] = useState(event?.locationId || '');
  const [significance, setSignificance] = useState<TimelineEvent['significance']>(
    event?.significance || 'minor'
  );
  const [characterIds, setCharacterIds] = useState<string[]>(event?.characterIds || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(event?.tags || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      date: date.trim() || undefined,
      locationId: locationId || undefined,
      significance,
      characterIds,
      tags: selectedTags,
      order: event?.order || 0,
    });
  };

  return (
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{event ? 'Edit Event' : 'Create Event'}</DialogTitle>
        <DialogDescription>
          Add an event to your story&apos;s timeline.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date/Time (in story)</Label>
            <Input
              id="date"
              placeholder="Year 1, Day of the Storm..."
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="significance">Significance</Label>
            <Select
              value={significance}
              onValueChange={(v) => setSignificance(v as TimelineEvent['significance'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="background">Background</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="What happens in this event..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label>Location</Label>
          <Select value={locationId || 'none'} onValueChange={(v) => setLocationId(v === 'none' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select location (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Involved Characters</Label>
          <div className="flex flex-wrap gap-2 p-2 border rounded-lg max-h-32 overflow-y-auto">
            {characters.length === 0 ? (
              <p className="text-sm text-stone-400">No characters yet</p>
            ) : (
              characters.map((char) => (
                <Badge
                  key={char.id}
                  variant={characterIds.includes(char.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() =>
                    setCharacterIds((prev) =>
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
        </div>

        {storyTags.length > 0 && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </Label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-lg max-h-32 overflow-y-auto">
              {storyTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1',
                      isSelected
                        ? 'ring-2 ring-amber-400'
                        : 'opacity-60 hover:opacity-100'
                    )}
                    style={{
                      backgroundColor: isSelected ? tag.color : `${tag.color}30`,
                      color: isSelected ? '#fff' : tag.color,
                    }}
                    onClick={() => {
                      setSelectedTags((prev) =>
                        isSelected
                          ? prev.filter((id) => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                  >
                    {tag.name}
                    {isSelected && <X className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
            {event ? 'Save Changes' : 'Create Event'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
