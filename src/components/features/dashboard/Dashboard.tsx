/**
 * Dashboard.tsx - Main dashboard for managing stories
 * 
 * This is the home page after login. Shows all user's stories
 * with options to create, edit, and delete them.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

// Store and auth
import { useStoryBoardStore } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Story } from '@/types';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  BookOpen,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Clock,
  LogOut,
  Search,
  Sparkles,
} from 'lucide-react';

// =============================================================================
// STYLE CONSTANTS
// =============================================================================

/** Colors for each story status */
const STATUS_COLORS: Record<Story['status'], string> = {
  'planning': 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  'on-hold': 'bg-stone-100 text-stone-700',
  'completed': 'bg-green-100 text-green-700',
};

/** Human-readable labels for each status */
const STATUS_LABELS: Record<Story['status'], string> = {
  'planning': 'Planning',
  'in-progress': 'In Progress',
  'on-hold': 'On Hold',
  'completed': 'Completed',
};

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

export function Dashboard() {
  // Get user and story data
  const { user, logout } = useAuth();
  const { stories, addStory, updateStory, deleteStory } = useStoryBoardStore();
  
  // Local state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter stories to only show current user's, with search
  const userStories = stories.filter((s) => s.userId === user?.id);
  const filteredStories = userStories.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle creating a new story
  const handleCreateStory = (data: Omit<Story, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    addStory({ ...data, userId: user!.id });
    setIsCreateOpen(false);
  };

  // Handle updating an existing story
  const handleUpdateStory = (data: Omit<Story, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (editingStory) {
      updateStory(editingStory.id, data);
      setEditingStory(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      {/* ===== HEADER ===== */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-amber-700" />
              </div>
              <span className="text-xl font-bold text-stone-800">StoryBoard</span>
            </div>

            {/* Search and User Menu */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Search stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-stone-50 border-stone-200"
                />
              </div>
              
              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-medium">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-stone-700">{user?.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title and Create Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">Your Stories</h1>
            <p className="text-stone-500 mt-1">
              {userStories.length === 0
                ? 'Start your first worldbuilding project'
                : `${userStories.length} ${userStories.length === 1 ? 'story' : 'stories'} in your workspace`}
            </p>
          </div>
          
          {/* Create Story Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                New Story
              </Button>
            </DialogTrigger>
            <StoryFormDialog onClose={() => setIsCreateOpen(false)} onSave={handleCreateStory} />
          </Dialog>
        </div>

        {/* Story Grid or Empty State */}
        {filteredStories.length === 0 ? (
          <EmptyState
            hasSearch={!!searchQuery}
            onCreateClick={() => setIsCreateOpen(true)}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onEdit={() => setEditingStory(story)}
                onDelete={() => deleteStory(story.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Edit Story Dialog */}
      <Dialog open={!!editingStory} onOpenChange={() => setEditingStory(null)}>
        {editingStory && (
          <StoryFormDialog
            story={editingStory}
            onClose={() => setEditingStory(null)}
            onSave={handleUpdateStory}
          />
        )}
      </Dialog>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Empty state shown when no stories exist */
function EmptyState({ hasSearch, onCreateClick }: { hasSearch: boolean; onCreateClick: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
        <Sparkles className="w-8 h-8 text-amber-600" />
      </div>
      <h3 className="text-lg font-medium text-stone-800 mb-2">
        {hasSearch ? 'No stories found' : 'No stories yet'}
      </h3>
      <p className="text-stone-500 mb-6 max-w-md mx-auto">
        {hasSearch
          ? 'Try adjusting your search query'
          : 'Create your first story to start building your fictional world'}
      </p>
      {!hasSearch && (
        <Button onClick={onCreateClick} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Story
        </Button>
      )}
    </div>
  );
}

/** Card displaying a single story */
function StoryCard({
  story,
  onEdit,
  onDelete,
}: {
  story: Story;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Link href={`/story/${story.id}`}>
      <Card className="group hover:shadow-lg transition-all duration-200 border-stone-200 bg-white/80 backdrop-blur cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-lg text-stone-800 group-hover:text-amber-700 transition-colors">
                {story.title}
              </CardTitle>
              {story.genre && (
                <CardDescription className="text-stone-500">{story.genre}</CardDescription>
              )}
            </div>
            
            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(); }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onDelete(); }} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Premise preview */}
          {story.premise && (
            <p className="text-sm text-stone-600 line-clamp-2">{story.premise}</p>
          )}
          
          {/* Theme badges */}
          {story.themes && story.themes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {story.themes.slice(0, 3).map((theme) => (
                <Badge key={theme} variant="secondary" className="bg-stone-100 text-stone-600 text-xs">
                  {theme}
                </Badge>
              ))}
              {story.themes.length > 3 && (
                <Badge variant="secondary" className="bg-stone-100 text-stone-600 text-xs">
                  +{story.themes.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          {/* Status and last updated */}
          <div className="flex items-center justify-between pt-2">
            <Badge className={STATUS_COLORS[story.status]}>{STATUS_LABELS[story.status]}</Badge>
            <div className="flex items-center text-xs text-stone-400">
              <Clock className="w-3 h-3 mr-1" />
              {formatDistanceToNow(new Date(story.updatedAt), { addSuffix: true })}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/** Dialog form for creating/editing a story */
function StoryFormDialog({
  story,
  onClose,
  onSave,
}: {
  story?: Story;
  onClose: () => void;
  onSave: (data: Omit<Story, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
}) {
  // Form state
  const [title, setTitle] = useState(story?.title || '');
  const [genre, setGenre] = useState(story?.genre || '');
  const [premise, setPremise] = useState(story?.premise || '');
  const [themes, setThemes] = useState(story?.themes.join(', ') || '');
  const [status, setStatus] = useState<Story['status']>(story?.status || 'planning');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      genre: genre.trim() || undefined,
      premise: premise.trim() || undefined,
      themes: themes.split(',').map((t) => t.trim()).filter(Boolean),
      status,
    });
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{story ? 'Edit Story' : 'Create New Story'}</DialogTitle>
        <DialogDescription>
          {story ? 'Update your story details' : 'Give your story an identity.'}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="The Chronicles of..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        {/* Genre */}
        <div className="space-y-2">
          <Label htmlFor="genre">Genre</Label>
          <Input
            id="genre"
            placeholder="Fantasy, Sci-Fi, Mystery..."
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />
        </div>
        
        {/* Premise */}
        <div className="space-y-2">
          <Label htmlFor="premise">Premise</Label>
          <Textarea
            id="premise"
            placeholder="A brief overview of your story..."
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            rows={3}
          />
        </div>
        
        {/* Themes */}
        <div className="space-y-2">
          <Label htmlFor="themes">Themes (comma-separated)</Label>
          <Input
            id="themes"
            placeholder="Love, Redemption, Power..."
            value={themes}
            onChange={(e) => setThemes(e.target.value)}
          />
        </div>
        
        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as Story['status'])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Buttons */}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
            {story ? 'Save Changes' : 'Create Story'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
