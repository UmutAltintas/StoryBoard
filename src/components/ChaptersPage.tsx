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
  } = useStoryBoardStore();

  const chapters = getChaptersByStory(storyId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [focusMode, setFocusMode] = useState(false);

  // Editor state
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [editingSummary, setEditingSummary] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
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
      // Escape to toggle focus mode
      if (e.key === 'Escape' && selectedChapterId) {
        setFocusMode((prev) => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, selectedChapterId]);

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
      <div className="flex h-[calc(100vh-4rem)] bg-[#faf9f7]">
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
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsCreating(true)}
                className="h-7 px-2 text-stone-500 hover:text-stone-800"
              >
                <Plus className="w-4 h-4" />
              </Button>
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
              <div className="flex-1 overflow-auto">
                <div className={`mx-auto transition-all duration-300 ${focusMode ? 'max-w-2xl' : 'max-w-3xl'} px-4 py-8`}>
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

                  {/* ===== MAIN WRITING AREA (PAGE) ===== */}
                  <div
                    className={`
                      relative bg-[#fdfaf6] shadow-xl border border-stone-200/70 rounded-2xl mx-auto
                      ${focusMode ? 'max-w-2xl' : 'max-w-3xl'}
                      min-h-[60vh] md:min-h-[70vh] px-0 py-0 flex flex-col
                    `}
                    style={{ boxShadow: '0 4px 32px 0 rgba(60,40,10,0.04)' }}
                  >
                    <div className="relative">
                      {(!editingContent || editingContent.trim() === '') && (
                        <div className="absolute left-0 top-0 w-full px-10 md:px-16 py-12 text-stone-300 pointer-events-none select-none font-serif text-[20px] leading-[2]">
                          Begin writing...
                        </div>
                      )}
                      <div
                        ref={textareaRef as any}
                        contentEditable
                        suppressContentEditableWarning
                        spellCheck={true}
                        role="textbox"
                        aria-label="Chapter text"
                        className="
                          outline-none focus:outline-none w-full h-full
                          font-serif text-[20px] leading-[2] tracking-wide
                          text-stone-800
                          px-10 md:px-16 py-12
                          whitespace-pre-wrap break-words
                          selection:bg-yellow-100 selection:text-stone-900
                          bg-transparent
                          transition-shadow
                        "
                        style={{ minHeight: focusMode ? '70vh' : '60vh', background: 'none' }}
                        onInput={e => {
                          const html = (e.target as HTMLDivElement).innerText;
                          onContentChange(html);
                        }}
                        dangerouslySetInnerHTML={{ __html: editingContent.replace(/\n/g, '<br>') }}
                      />
                    </div>
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
                </div>
              </div>

              {/* ===== BOTTOM STATUS BAR ===== */}
              <div className={`border-t border-stone-200 bg-white px-4 py-2 transition-opacity ${focusMode ? 'opacity-0 hover:opacity-100' : ''}`}>
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
      </div>
    </TooltipProvider>
  );
}

export default ChaptersPage;
