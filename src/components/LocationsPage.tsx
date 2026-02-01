'use client';

/**
 * LocationsPage.tsx
 * 
 * The location management page for worldbuilding. Writers can:
 * - Create and manage locations (cities, countries, buildings, natural features)
 * - Define parent-child relationships between locations
 * - Link locations to characters and events
 * - Add history and story significance for each place
 * 
 * Layout: Master-detail pattern with a location list and a detail view.
 */

import { useState } from 'react';
import { useStoryBoardStore } from '@/lib/store';
import { Location } from '@/lib/types';
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
  MapPin,
  Users,
  Clock,
  Building2,
  Globe,
  Mountain,
  Castle,
  Sparkles,
} from 'lucide-react';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface LocationsPageProps {
  storyId: string;
}

/** Icons for each location type */
const typeIcons: Record<Location['type'], React.ComponentType<{ className?: string }>> = {
  city: Building2,
  country: Globe,
  building: Building2,
  natural: Mountain,
  fictional: Castle,
  other: MapPin,
};

/** Color scheme for location type badges */
const typeColors: Record<Location['type'], string> = {
  city: 'bg-blue-100 text-blue-700',
  country: 'bg-green-100 text-green-700',
  building: 'bg-purple-100 text-purple-700',
  natural: 'bg-emerald-100 text-emerald-700',
  fictional: 'bg-amber-100 text-amber-700',
  other: 'bg-stone-100 text-stone-700',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LocationsPage({ storyId }: LocationsPageProps) {
  // Get store actions and data
  const {
    getLocationsByStory,
    addLocation,
    updateLocation,
    deleteLocation,
    getCharactersByStory,
    getEventsByStory,
  } = useStoryBoardStore();

  // Fetch related data
  const locations = getLocationsByStory(storyId);
  const characters = getCharactersByStory(storyId);
  const events = getEventsByStory(storyId);

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Filter locations by search query
  const filteredLocations = locations.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handler: Create a new location
  const handleCreateLocation = (data: Omit<Location, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => {
    const newLocation = addLocation({ ...data, storyId });
    setIsCreateOpen(false);
    setSelectedLocation(newLocation);
  };

  // Handler: Update an existing location
  const handleUpdateLocation = (data: Omit<Location, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => {
    if (editingLocation) {
      updateLocation(editingLocation.id, data);
      setEditingLocation(null);
      if (selectedLocation?.id === editingLocation.id) {
        setSelectedLocation({ ...selectedLocation, ...data } as Location);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex">
      {/* ------------------------------------------------------------------ */}
      {/* LEFT SIDEBAR: Location List */}
      {/* ------------------------------------------------------------------ */}
      <div className="w-full lg:w-80 border-r border-stone-200 bg-white/80 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-stone-800">Locations</h1>
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
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-stone-50 border-stone-200"
            />
          </div>
        </div>

        {/* Location list */}
        <ScrollArea className="flex-1">
          {filteredLocations.length === 0 ? (
            <div className="p-4 text-center text-stone-500">
              {searchQuery ? 'No locations found' : 'No locations yet'}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredLocations.map((location) => {
                const Icon = typeIcons[location.type];
                return (
                  <button
                    key={location.id}
                    onClick={() => setSelectedLocation(location)}
                    className={cn(
                      'w-full p-3 rounded-lg text-left transition-colors',
                      selectedLocation?.id === location.id
                        ? 'bg-amber-100'
                        : 'hover:bg-stone-100'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', typeColors[location.type])}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-800 truncate">
                          {location.name}
                        </p>
                        <Badge className={cn('text-xs', typeColors[location.type])}>
                          {location.type}
                        </Badge>
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
      {/* RIGHT PANEL: Location Details (desktop only) */}
      {/* ------------------------------------------------------------------ */}
      <div className="hidden lg:flex flex-1 flex-col bg-gradient-to-br from-stone-50 to-amber-50">
        {selectedLocation ? (
          <LocationDetails
            location={selectedLocation}
            locations={locations}
            characters={characters}
            events={events}
            onEdit={() => setEditingLocation(selectedLocation)}
            onDelete={() => {
              deleteLocation(selectedLocation.id);
              setSelectedLocation(null);
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-stone-800 mb-2">
                Select a location
              </h3>
              <p className="text-stone-500 max-w-xs">
                Choose a location from the list to view details, or create a new one.
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
        <LocationDialog
          locations={locations}
          onClose={() => setIsCreateOpen(false)}
          onSave={handleCreateLocation}
        />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={() => setEditingLocation(null)}>
        {editingLocation && (
          <LocationDialog
            location={editingLocation}
            locations={locations}
            onClose={() => setEditingLocation(null)}
            onSave={handleUpdateLocation}
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
 * LocationDetails - Displays the full profile of a selected location.
 * Shows description, history, significance, sub-locations, and linked elements.
 */
function LocationDetails({
  location,
  locations,
  characters,
  events,
  onEdit,
  onDelete,
}: {
  location: Location;
  locations: Location[];
  characters: { id: string; name: string }[];
  events: { id: string; title: string; locationId?: string }[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = typeIcons[location.type];
  
  // Find parent and child locations
  const parentLocation = location.parentLocationId
    ? locations.find((l) => l.id === location.parentLocationId)
    : null;
  const childLocations = locations.filter((l) => l.parentLocationId === location.id);
  
  // Find linked characters and events
  const locationCharacters = characters.filter((c) =>
    location.characterIds.includes(c.id)
  );
  const locationEvents = events.filter((e) => e.locationId === location.id);

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('p-4 rounded-xl', typeColors[location.type])}>
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-800">{location.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={typeColors[location.type]}>{location.type}</Badge>
                {parentLocation && (
                  <span className="text-sm text-stone-500">
                    in {parentLocation.name}
                  </span>
                )}
              </div>
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

        {/* Description Card */}
        {location.description && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-stone-700 whitespace-pre-wrap">{location.description}</p>
            </CardContent>
          </Card>
        )}

        {/* History Card */}
        {location.history && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">
                History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-stone-700 whitespace-pre-wrap">{location.history}</p>
            </CardContent>
          </Card>
        )}

        {/* Significance Card (highlighted) */}
        {location.significance && (
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <CardTitle className="text-sm font-medium text-amber-700">
                  Story Significance
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-stone-700">{location.significance}</p>
            </CardContent>
          </Card>
        )}

        {/* Sub-Locations Card */}
        {childLocations.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm font-medium text-stone-500">
                  Sub-Locations
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {childLocations.map((child) => (
                  <Badge key={child.id} variant="secondary">
                    {child.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connected Characters & Events */}
        <div className="grid md:grid-cols-2 gap-4">
          {locationCharacters.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <CardTitle className="text-sm font-medium text-stone-500">
                    Characters Here
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {locationCharacters.map((char) => (
                    <Badge key={char.id} variant="outline">
                      {char.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {locationEvents.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <CardTitle className="text-sm font-medium text-stone-500">
                    Events Here
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {locationEvents.map((event) => (
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
        {location.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-stone-700 whitespace-pre-wrap">{location.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

/**
 * LocationDialog - Form dialog for creating/editing a location.
 */
function LocationDialog({
  location,
  locations,
  onClose,
  onSave,
}: {
  location?: Location;
  locations: Location[];
  onClose: () => void;
  onSave: (data: Omit<Location, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>) => void;
}) {
  // Form state
  const [name, setName] = useState(location?.name || '');
  const [type, setType] = useState<Location['type']>(location?.type || 'city');
  const [description, setDescription] = useState(location?.description || '');
  const [history, setHistory] = useState(location?.history || '');
  const [significance, setSignificance] = useState(location?.significance || '');
  const [parentLocationId, setParentLocationId] = useState(location?.parentLocationId || '');
  const [notes, setNotes] = useState(location?.notes || '');

  // Exclude current location from parent options
  const availableParents = locations.filter((l) => l.id !== location?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      history: history.trim() || undefined,
      significance: significance.trim() || undefined,
      parentLocationId: parentLocationId || undefined,
      notes: notes.trim() || undefined,
      characterIds: location?.characterIds || [],
      eventIds: location?.eventIds || [],
      tags: location?.tags || [],
    });
  };

  return (
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{location ? 'Edit Location' : 'Create Location'}</DialogTitle>
        <DialogDescription>
          Define this location and how it fits into your world.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Type */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Location name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as Location['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="city">City</SelectItem>
                <SelectItem value="country">Country</SelectItem>
                <SelectItem value="building">Building</SelectItem>
                <SelectItem value="natural">Natural</SelectItem>
                <SelectItem value="fictional">Fictional</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Parent Location */}
        {availableParents.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="parent">Parent Location</Label>
            <Select value={parentLocationId} onValueChange={setParentLocationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select parent location (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {availableParents.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe this location..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* History */}
        <div className="space-y-2">
          <Label htmlFor="history">History</Label>
          <Textarea
            id="history"
            placeholder="Historical background..."
            value={history}
            onChange={(e) => setHistory(e.target.value)}
            rows={3}
          />
        </div>

        {/* Significance */}
        <div className="space-y-2">
          <Label htmlFor="significance">Story Significance</Label>
          <Textarea
            id="significance"
            placeholder="Why is this place important to the story?"
            value={significance}
            onChange={(e) => setSignificance(e.target.value)}
            rows={2}
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
            {location ? 'Save Changes' : 'Create Location'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
