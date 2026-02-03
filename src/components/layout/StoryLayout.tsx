/**
 * StoryLayout.tsx - Layout wrapper for story workspace pages
 * 
 * Provides the sidebar navigation and header for all story-related pages.
 * Includes responsive design with mobile hamburger menu.
 */

'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Store
import { useStoryBoardStore } from '@/lib/store';

// UI Components
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// Related components
import { GlobalSearch } from '@/components/features/story';

// Icons
import {
  BookOpen,
  Users,
  MapPin,
  BookMarked,
  Clock,
  Lightbulb,
  Network,
  Search,
  Home,
  Menu,
  ChevronLeft,
  FileText,
  GitBranch,
  Tag,
} from 'lucide-react';

// =============================================================================
// NAVIGATION CONFIG
// =============================================================================

/** Sidebar navigation items */
const NAVIGATION = [
  { name: 'Overview', href: '', icon: Home },
  { name: 'Chapters', href: '/chapters', icon: FileText },
  { name: 'Characters', href: '/characters', icon: Users },
  { name: 'Locations', href: '/locations', icon: MapPin },
  { name: 'Story Details', href: '/lore', icon: BookMarked },
  { name: 'Timeline', href: '/timeline', icon: Clock },
  { name: 'Ideas', href: '/ideas', icon: Lightbulb },
  { name: 'Connections', href: '/connections', icon: Network },
  { name: 'Tags', href: '/tags', icon: Tag },
];

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface StoryLayoutProps {
  children: ReactNode;
  storyId: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function StoryLayout({ children, storyId }: StoryLayoutProps) {
  const pathname = usePathname();
  const { getStory } = useStoryBoardStore();
  const story = getStory(storyId);
  const [searchOpen, setSearchOpen] = useState(false);

  // Show error if story doesn't exist
  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Story not found</h2>
          <Link href="/">
            <Button variant="outline">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if a nav item is currently active
  const isActive = (href: string) => {
    const fullPath = `/story/${storyId}${href}`;
    return href === '' ? pathname === `/story/${storyId}` : pathname.startsWith(fullPath);
  };

  // ===== SIDEBAR CONTENT (shared between desktop and mobile) =====
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Story Header */}
      <div className="p-4 border-b border-stone-200">
        <Link
          href="/"
          className="flex items-center gap-2 text-stone-500 hover:text-stone-700 text-sm mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          All Stories
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <BookOpen className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-stone-800 truncate">{story.title}</h2>
            {story.genre && <p className="text-xs text-stone-500 truncate">{story.genre}</p>}
          </div>
        </div>
      </div>

      {/* Search Button */}
      <div className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start text-stone-500"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="w-4 h-4 mr-2" />
          Search...
          <kbd className="ml-auto text-xs bg-stone-100 px-1.5 py-0.5 rounded">⌘K</kbd>
        </Button>
      </div>

      {/* Navigation Links */}
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1">
          {NAVIGATION.map((item) => (
            <Link
              key={item.name}
              href={`/story/${storyId}${item.href}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-amber-100 text-amber-800'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-800'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      {/* ===== MOBILE HEADER ===== */}
      <header className="lg:hidden border-b border-stone-200 bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              {sidebarContent}
            </SheetContent>
          </Sheet>
          
          <span className="font-semibold text-stone-800">{story.title}</span>
          
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* ===== DESKTOP SIDEBAR ===== */}
        <aside className="hidden lg:block w-64 border-r border-stone-200 bg-white/80 backdrop-blur fixed h-screen">
          {sidebarContent}
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 lg:ml-64 min-h-screen">
          {children}
        </main>
      </div>

      {/* Global Search Modal (⌘K) */}
      <GlobalSearch storyId={storyId} open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
