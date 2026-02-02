/**
 * ChaptersPage.tsx - Full-Page Writing Experience for Authors
 * 
 * Designed with writers in mind:
 * - Distraction-free full-page writing mode
 * - Collapsible sidebar for focus
 * - Typewriter-style comfortable typography
 * - Session stats and goal tracking
 * - Keyboard shortcuts
 * - Auto-save with visual feedback
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStoryBoardStore } from '@/lib/store';
import { ChapterStatus } from '@/types';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Icons
import {
  Plus,
  FileText,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Target,
  Clock,
  Feather,
  Check,
  Circle,
  Sparkles,
  MoreHorizontal,
  BookOpen,
  X,
  ArrowUp,
  Tag,
} from 'lucide-react';

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_OPTIONS: { value: ChapterStatus; label: string; color: string; icon: typeof Circle }[] = [
  { value: 'draft', label: 'Draft', color: 'text-stone-500', icon: Circle },
  { value: 'revision', label: 'Revising', color: 'text-amber-500', icon: MoreHorizontal },
  { value: 'complete', label: 'Complete', color: 'text-green-500', icon: Check },
];

const DAILY_GOAL_OPTIONS = [250, 500, 1000, 1500, 2000, 2500, 3000];

// =============================================================================
// COMPONENT
// =============================================================================

interface ChaptersPageProps {
  storyId: string;
}

export function ChaptersPage({ storyId }: ChaptersPageProps) {
  const {
    getChaptersByStory,
    addChapter,
    updateChapter,
    deleteChapter,
    reorderChapters,
    getTagsByStory,
  } = useStoryBoardStore();

  const storyTags = getTagsByStory(storyId);

  const chapters = getChaptersByStory(storyId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [readAllMode, setReadAllMode] = useState(false);

  // Editor state
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [editingSummary, setEditingSummary] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [editingStatus, setEditingStatus] = useState<ChapterStatus>('draft');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Writing session tracking
  const [sessionStartWords, setSessionStartWords] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [dailyGoal, setDailyGoal] = useState(1000);
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);
  const currentIndex = chapters.findIndex((c) => c.id === selectedChapterId);

  // Load chapter content when selection changes
  useEffect(() => {
    if (!selectedChapter) return;
    
    setEditingTitle(selectedChapter.title);
    setEditingContent(selectedChapter.content);
    setEditingSummary(selectedChapter.summary || '');
    setEditingNotes(selectedChapter.notes || '');
    setEditingStatus(selectedChapter.status);
    setEditingTags(selectedChapter.tags || []);
    setHasUnsavedChanges(false);
    
    // Start new writing session
    const words = selectedChapter.content.trim().split(/\s+/).filter(Boolean).length;
    setSessionStartWords(words);
    setSessionStartTime(new Date());
  }, [selectedChapterId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Word counts
  const wordCount = editingContent.trim().split(/\s+/).filter(Boolean).length;
  const sessionWords = Math.max(0, wordCount - sessionStartWords);
  const totalWordCount = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
  const goalProgress = Math.min(100, (sessionWords / dailyGoal) * 100);

  // Session duration
  const [sessionMinutes, setSessionMinutes] = useState(0);
  useEffect(() => {
    if (!sessionStartTime) return;
    const interval = setInterval(() => {
      setSessionMinutes(Math.floor((Date.now() - sessionStartTime.getTime()) / 60000));
    }, 60000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Save handler
  const handleSave = useCallback(() => {
    if (!selectedChapterId) return;
    
    updateChapter(selectedChapterId, {
      title: editingTitle,
      content: editingContent,
      summary: editingSummary,
      notes: editingNotes,
      status: editingStatus,
      tags: editingTags,
      wordCount,
    });
    
    setHasUnsavedChanges(false);
    setLastSaved(new Date());
  }, [selectedChapterId, editingTitle, editingContent, editingSummary, editingNotes, editingStatus, wordCount, updateChapter]);

  // Auto-save (debounced)
  useEffect(() => {
    if (!hasUnsavedChanges || !selectedChapterId) return;
    const timer = setTimeout(handleSave, 2000);
    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, selectedChapterId, handleSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Escape in read mode to exit
      if (e.key === 'Escape' && readAllMode) {
        setReadAllMode(false);
        return;
      }
      // Escape to toggle focus mode
      if (e.key === 'Escape' && selectedChapterId) {
        setFocusMode((prev) => !prev);
      }
      // Cmd/Ctrl + Shift + R to enter read mode
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'r' && chapters.length > 0) {
        e.preventDefault();
        setReadAllMode(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, selectedChapterId, readAllMode, chapters.length]);

  // Create new chapter
  const handleCreateChapter = () => {
    if (!newTitle.trim()) return;
    
    const chapter = addChapter({
      storyId,
      title: newTitle.trim(),
      content: '',
      status: 'draft',
      order: chapters.length,
      tags: [],
      characterIds: [],
      locationIds: [],
    });
    
    setNewTitle('');
    setIsCreating(false);
    setSelectedChapterId(chapter.id);
  };

  // Navigation
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setSelectedChapterId(chapters[currentIndex - 1].id);
    }
  };

  const goToNext = () => {
    if (currentIndex < chapters.length - 1) {
      setSelectedChapterId(chapters[currentIndex + 1].id);
    }
  };

  // Move chapter
  const moveChapter = (chapterId: string, direction: 'up' | 'down') => {
    const idx = chapters.findIndex((c) => c.id === chapterId);
    if (idx === -1) return;
    
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= chapters.length) return;
    
    const newOrder = [...chapters.map((c) => c.id)];
    [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
    reorderChapters(storyId, newOrder);
  };

  // Delete chapter
  const handleDeleteChapter = (chapterId: string) => {
    if (!confirm('Delete this chapter? This cannot be undone.')) return;
    deleteChapter(chapterId);
    if (selectedChapterId === chapterId) {
      setSelectedChapterId(null);
    }
  };

  // Mark content changed
  const onContentChange = (value: string) => {
    setEditingContent(value);
    setHasUnsavedChanges(true);
  };

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-white">
        {/* ===== COLLAPSIBLE CHAPTER SIDEBAR ===== */}
        <div
          className={`${
            sidebarOpen ? 'w-72' : 'w-0'
          } transition-all duration-300 overflow-hidden border-r border-stone-200 bg-white flex flex-col`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-stone-100">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-stone-600 uppercase tracking-wide">
                Chapters
              </h2>
              <div className="flex items-center gap-1">
                {chapters.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setReadAllMode(true)}
                        className="h-7 px-2 text-stone-500 hover:text-stone-800"
                      >
                        <BookOpen className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Read all chapters</TooltipContent>
                  </Tooltip>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCreating(true)}
                  className="h-7 px-2 text-stone-500 hover:text-stone-800"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-3 text-xs text-stone-400">
              <span>{chapters.length} chapters</span>
              <span>•</span>
              <span>{totalWordCount.toLocaleString()} words</span>
            </div>
          </div>

          {/* Create Chapter Input */}
          {isCreating && (
            <div className="p-3 border-b border-stone-100 bg-stone-50">
              <Input
                placeholder="Chapter title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateChapter();
                  if (e.key === 'Escape') setIsCreating(false);
                }}
                autoFocus
                className="text-sm"
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" className="h-7 text-xs" onClick={handleCreateChapter}>
                  Create
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Chapter List */}
          <ScrollArea className="flex-1">
            <div className="py-2">
              {chapters.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Feather className="w-8 h-8 mx-auto mb-3 text-stone-300" />
                  <p className="text-sm text-stone-400">No chapters yet</p>
                  <Button
                    variant="link"
                    className="text-sm mt-1"
                    onClick={() => setIsCreating(true)}
                  >
                    Start your first chapter
                  </Button>
                </div>
              ) : (
                chapters.map((chapter, index) => {
                  const StatusIcon = STATUS_OPTIONS.find(s => s.value === chapter.status)?.icon || Circle;
                  const statusColor = STATUS_OPTIONS.find(s => s.value === chapter.status)?.color || '';
                  
                  return (
                    <div
                      key={chapter.id}
                      className={`group mx-2 mb-1 rounded-lg cursor-pointer transition-all ${
                        selectedChapterId === chapter.id
                          ? 'bg-stone-100'
                          : 'hover:bg-stone-50'
                      }`}
                      onClick={() => setSelectedChapterId(chapter.id)}
                    >
                      <div className="p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-stone-300 font-mono mt-0.5 w-5">
                            {(index + 1).toString().padStart(2, '0')}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <StatusIcon className={`w-3 h-3 ${statusColor}`} />
                              <span className="text-sm font-medium text-stone-700 truncate">
                                {chapter.title}
                              </span>
                            </div>
                            <div className="text-xs text-stone-400 mt-0.5">
                              {(chapter.wordCount || 0).toLocaleString()} words
                            </div>
                          </div>
                        </div>
                        
                        {/* Hover Actions */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 mt-2 ml-5 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); moveChapter(chapter.id, 'up'); }}
                            disabled={index === 0}
                          >
                            <ChevronUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); moveChapter(chapter.id, 'down'); }}
                            disabled={index === chapters.length - 1}
                          >
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-400 hover:text-red-600"
                            onClick={(e) => { e.stopPropagation(); handleDeleteChapter(chapter.id); }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ===== MAIN WRITING AREA ===== */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedChapter ? (
            <>
              {/* ===== WRITING TOOLBAR ===== */}
              <div className={`border-b border-stone-200 bg-white transition-opacity ${focusMode ? 'opacity-0 hover:opacity-100' : ''}`}>
                <div className="flex items-center justify-between px-4 py-2">
                  {/* Left: Sidebar Toggle + Navigation */}
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Toggle sidebar</TooltipContent>
                    </Tooltip>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={goToPrevious}
                        disabled={currentIndex <= 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-stone-500 min-w-[60px] text-center">
                        {currentIndex + 1} / {chapters.length}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={goToNext}
                        disabled={currentIndex >= chapters.length - 1}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Center: Title */}
                  <div className="flex-1 max-w-md mx-4">
                    <Input
                      value={editingTitle}
                      onChange={(e) => {
                        setEditingTitle(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="text-center font-serif text-lg border-none shadow-none bg-transparent focus-visible:ring-0"
                      placeholder="Chapter Title"
                    />
                  </div>

                  {/* Right: Status + Save */}
                  <div className="flex items-center gap-3">
                    <Select
                      value={editingStatus}
                      onValueChange={(v) => {
                        setEditingStatus(v as ChapterStatus);
                        setHasUnsavedChanges(true);
                      }}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <opt.icon className={`w-3 h-3 ${opt.color}`} />
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {hasUnsavedChanges ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 text-xs">
                        Saving...
                      </Badge>
                    ) : lastSaved ? (
                      <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                        <Check className="w-3 h-3 mr-1" />
                        Saved
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* ===== WRITING CANVAS ===== */}
              <div className="flex-1 overflow-auto relative">
                <div className={`mx-auto transition-all duration-300 ${focusMode ? 'max-w-2xl' : 'max-w-3xl'} px-4 py-8 pb-28`}>
                  {/* Summary (collapsible in focus mode) */}
                  {!focusMode && editingSummary.trim() === '' && (
                    <div className="mb-6">
                      <Textarea
                        placeholder="Add a brief chapter summary... (optional)"
                        value={editingSummary}
                        onChange={(e) => {
                          setEditingSummary(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="resize-none bg-transparent border-dashed border-stone-200 text-sm text-stone-500 placeholder:text-stone-300"
                        rows={2}
                      />
                    </div>
                  )}
                  
                  {!focusMode && editingSummary.trim() !== '' && (
                    <div className="mb-6 p-4 bg-white/50 rounded-lg border border-stone-200">
                      <Textarea
                        placeholder="Chapter summary..."
                        value={editingSummary}
                        onChange={(e) => {
                          setEditingSummary(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="resize-none bg-transparent border-none text-sm text-stone-600 focus-visible:ring-0 p-0"
                        rows={2}
                      />
                    </div>
                  )}

                  {/* ===== MAIN WRITING AREA ===== */}
                  <div className="bg-white rounded-xl shadow-sm border border-stone-200/50 overflow-hidden">
                    <Textarea
                      ref={textareaRef}
                      placeholder="Begin writing..."
                      value={editingContent}
                      onChange={(e) => onContentChange(e.target.value)}
                      className={`
                        w-full border-none focus-visible:ring-0 resize-none
                        text-[18px] leading-[1.8] tracking-wide
                        text-stone-800 placeholder:text-stone-300
                        p-8 md:p-12
                        ${focusMode ? 'min-h-[70vh]' : 'min-h-[50vh]'}
                        font-[Average,Georgia,Times,serif]
                      `}
                      style={{ 
                        fontFamily: "'Average', Georgia, 'Times New Roman', serif",
                      }}
                    />
                  </div>

                  {/* Author Notes (hidden in focus mode) */}
                  {!focusMode && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-stone-500">Author Notes</span>
                      </div>
                      <Textarea
                        placeholder="Private notes, reminders, ideas for later..."
                        value={editingNotes}
                        onChange={(e) => {
                          setEditingNotes(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        className="resize-none bg-amber-50/50 border-amber-200/50 text-sm"
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Chapter Tags (hidden in focus mode) */}
                  {!focusMode && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-stone-500">Tags</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {storyTags.map((tag) => {
                          const isSelected = editingTags.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              onClick={() => {
                                if (isSelected) {
                                  setEditingTags(editingTags.filter(t => t !== tag.id));
                                } else {
                                  setEditingTags([...editingTags, tag.id]);
                                }
                                setHasUnsavedChanges(true);
                              }}
                              className={`
                                inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm
                                transition-all cursor-pointer
                                ${isSelected 
                                  ? 'ring-2 ring-amber-400' 
                                  : 'opacity-60 hover:opacity-100'
                                }
                              `}
                              style={{
                                backgroundColor: isSelected ? tag.color : `${tag.color}30`,
                                color: isSelected ? '#fff' : tag.color,
                              }}
                            >
                              {tag.name}
                              {isSelected && <X className="w-3 h-3" />}
                            </button>
                          );
                        })}
                        {storyTags.length === 0 && (
                          <span className="text-sm text-stone-400 italic">
                            No tags yet. Create tags in the Tags section.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ===== BOTTOM STATUS BAR (FIXED) ===== */}
              <div
                className={`border-t border-stone-200 bg-white/95 backdrop-blur-sm shadow-[0_-2px_12px_#0001] px-4 py-2 transition-opacity ${focusMode ? 'opacity-0 hover:opacity-100' : ''}`}
                style={{
                  position: 'fixed',
                  left: '250px', // width of sidebar
                  right: 0,
                  bottom: 0,
                  zIndex: 50,
                  maxWidth: 'calc(100vw - 250px)',
                }}
              >
                <div className="flex items-center justify-between text-sm">
                  {/* Left: Word counts */}
                  <div className="flex items-center gap-6 text-stone-500">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{wordCount.toLocaleString()} words</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <Feather className="w-4 h-4" />
                      <span>+{sessionWords.toLocaleString()} this session</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{sessionMinutes} min</span>
                    </div>
                  </div>

                  {/* Right: Daily goal */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <button
                        onClick={() => setShowGoalPicker(!showGoalPicker)}
                        className="flex items-center gap-2 text-stone-500 hover:text-stone-700"
                      >
                        <Target className="w-4 h-4" />
                        <span>Goal: {dailyGoal.toLocaleString()}</span>
                      </button>
                      {showGoalPicker && (
                        <div className="absolute bottom-8 right-0 bg-white border border-stone-200 rounded-lg shadow-lg p-2 z-10">
                          {DAILY_GOAL_OPTIONS.map((goal) => (
                            <button
                              key={goal}
                              onClick={() => { setDailyGoal(goal); setShowGoalPicker(false); }}
                              className={`block w-full text-left px-3 py-1.5 text-sm rounded hover:bg-stone-100 ${
                                dailyGoal === goal ? 'bg-stone-100 font-medium' : ''
                              }`}
                            >
                              {goal.toLocaleString()} words
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="w-32 h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          goalProgress >= 100 ? 'bg-green-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${goalProgress}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${goalProgress >= 100 ? 'text-green-600' : 'text-stone-600'}`}>
                      {Math.round(goalProgress)}%
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ===== EMPTY STATE ===== */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
                  <Feather className="w-10 h-10 text-stone-400" />
                </div>
                <h2 className="text-2xl font-serif text-stone-700 mb-2">
                  Ready to Write?
                </h2>
                <p className="text-stone-500 mb-6">
                  Select a chapter from the sidebar to continue your story, or create a new one to begin.
                </p>
                <Button
                  onClick={() => { setSidebarOpen(true); setIsCreating(true); }}
                  className="bg-stone-800 hover:bg-stone-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start a New Chapter
                </Button>
                
                <div className="mt-8 text-xs text-stone-400">
                  <p>Press <kbd className="px-1.5 py-0.5 bg-stone-100 rounded text-stone-500">Esc</kbd> for focus mode</p>
                  <p className="mt-1">Press <kbd className="px-1.5 py-0.5 bg-stone-100 rounded text-stone-500">⌘S</kbd> to save</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== READ ALL MODE OVERLAY ===== */}
        {readAllMode && (
          <div className="fixed inset-0 z-[100] bg-[#faf9f7] overflow-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[#faf9f7]/95 backdrop-blur-sm border-b border-stone-200 z-10">
              <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-stone-600" />
                  <span className="font-serif text-lg text-stone-700">Reading Mode</span>
                  <span className="text-sm text-stone-400">
                    {chapters.length} chapters • {totalWordCount.toLocaleString()} words
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setReadAllMode(false)}
                  className="h-8 w-8"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Chapters Content */}
            <div className="max-w-3xl mx-auto px-4 py-12">
              {chapters.map((chapter, index) => (
                <article key={chapter.id} className="mb-16">
                  {/* Chapter Header */}
                  <header className="mb-8 text-center">
                    <div className="text-sm font-medium text-stone-400 uppercase tracking-widest mb-2">
                      Chapter {index + 1}
                    </div>
                    <h2 className="font-serif text-3xl md:text-4xl text-stone-800 mb-3">
                      {chapter.title}
                    </h2>
                    {chapter.summary && (
                      <p className="text-stone-500 italic max-w-xl mx-auto">
                        {chapter.summary}
                      </p>
                    )}
                    <div className="mt-4 text-sm text-stone-400">
                      {(chapter.wordCount || 0).toLocaleString()} words
                    </div>
                  </header>

                  {/* Chapter Content */}
                  <div 
                    className="prose prose-stone prose-lg max-w-none"
                    style={{ 
                      fontFamily: "'Average', Georgia, 'Times New Roman', serif",
                      fontSize: '18px',
                      lineHeight: '1.9',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {chapter.content ? (
                      chapter.content.split('\n\n').map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-stone-700 mb-6 text-justify">
                          {paragraph.split('\n').map((line, lIndex, arr) => (
                            <span key={lIndex}>
                              {line}
                              {lIndex < arr.length - 1 && <br />}
                            </span>
                          ))}
                        </p>
                      ))
                    ) : (
                      <p className="text-stone-400 italic text-center">
                        This chapter has no content yet.
                      </p>
                    )}
                  </div>

                  {/* Chapter Divider */}
                  {index < chapters.length - 1 && (
                    <div className="flex items-center justify-center mt-16">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-px bg-stone-300" />
                        <Feather className="w-4 h-4 text-stone-300" />
                        <div className="w-16 h-px bg-stone-300" />
                      </div>
                    </div>
                  )}
                </article>
              ))}

              {/* End of Story */}
              <div className="text-center py-12 border-t border-stone-200 mt-8">
                <p className="text-sm text-stone-400 uppercase tracking-widest mb-4">
                  — End —
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setReadAllMode(false);
                    window.scrollTo(0, 0);
                  }}
                  className="gap-2"
                >
                  <ArrowUp className="w-4 h-4" />
                  Back to Writing
                </Button>
              </div>
            </div>

            {/* Floating back-to-top button */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-6 right-6 p-3 bg-white rounded-full shadow-lg border border-stone-200 hover:bg-stone-50 transition-colors"
              title="Back to top"
            >
              <ArrowUp className="w-5 h-5 text-stone-600" />
            </button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default ChaptersPage;
