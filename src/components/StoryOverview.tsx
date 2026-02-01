/**
 * StoryOverview.tsx - Story workspace overview/home page
 * 
 * Shows story details and quick access cards to all sections
 * (characters, locations, lore, timeline, ideas).
 */

'use client';

import Link from 'next/link';

// Store and types
import { useStoryBoardStore } from '@/lib/store';
import { Story } from '@/lib/types';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Icons
import {
  Users,
  MapPin,
  BookMarked,
  Clock,
  Lightbulb,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Status badge colors */
const STATUS_COLORS: Record<Story['status'], string> = {
  'planning': 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  'on-hold': 'bg-stone-100 text-stone-700',
  'completed': 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<Story['status'], string> = {
  'planning': 'Planning',
  'in-progress': 'In Progress',
  'on-hold': 'On Hold',
  'completed': 'Completed',
};

// =============================================================================
// COMPONENT
// =============================================================================

interface StoryOverviewProps {
  story: Story;
}

export function StoryOverview({ story }: StoryOverviewProps) {
  // Get counts for each section
  const {
    getCharactersByStory,
    getLocationsByStory,
    getLoreEntriesByStory,
    getEventsByStory,
    getIdeaCardsByStory,
  } = useStoryBoardStore();

  const characters = getCharactersByStory(story.id);
  const locations = getLocationsByStory(story.id);
  const loreEntries = getLoreEntriesByStory(story.id);
  const events = getEventsByStory(story.id);
  const ideas = getIdeaCardsByStory(story.id);

  // Section cards configuration
  const sections = [
    {
      name: 'Characters',
      count: characters.length,
      icon: Users,
      href: `/story/${story.id}/characters`,
      color: 'text-amber-600 bg-amber-100',
      description: 'Define the people in your story',
    },
    {
      name: 'Locations',
      count: locations.length,
      icon: MapPin,
      href: `/story/${story.id}/locations`,
      color: 'text-blue-600 bg-blue-100',
      description: 'Map your fictional world',
    },
    {
      name: 'Lore',
      count: loreEntries.length,
      icon: BookMarked,
      href: `/story/${story.id}/lore`,
      color: 'text-green-600 bg-green-100',
      description: 'Build world details and systems',
    },
    {
      name: 'Timeline',
      count: events.length,
      icon: Clock,
      href: `/story/${story.id}/timeline`,
      color: 'text-purple-600 bg-purple-100',
      description: 'Organize events chronologically',
    },
    {
      name: 'Ideas',
      count: ideas.length,
      icon: Lightbulb,
      href: `/story/${story.id}/ideas`,
      color: 'text-yellow-600 bg-yellow-100',
      description: 'Capture sparks of inspiration',
    },
  ];

  const isEmpty = characters.length === 0 && locations.length === 0 && 
                  loreEntries.length === 0 && events.length === 0 && ideas.length === 0;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* ===== STORY HEADER ===== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-stone-800">{story.title}</h1>
          <Badge className={STATUS_COLORS[story.status]}>
            {STATUS_LABELS[story.status]}
          </Badge>
        </div>
        
        {story.genre && <p className="text-lg text-stone-500">{story.genre}</p>}

        {/* Premise */}
        {story.premise && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <p className="text-stone-700 italic">{story.premise}</p>
            </CardContent>
          </Card>
        )}

        {/* Themes */}
        {story.themes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {story.themes.map((theme) => (
              <Badge key={theme} variant="outline" className="border-stone-300 text-stone-600">
                {theme}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* ===== QUICK STATS ===== */}
      <div className="grid grid-cols-5 gap-4">
        {sections.map((section) => (
          <div key={section.name} className="text-center p-4 bg-white/60 rounded-xl border border-stone-200">
            <div className={`inline-flex p-2 rounded-lg ${section.color} mb-2`}>
              <section.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-stone-800">{section.count}</p>
            <p className="text-xs text-stone-500">{section.name}</p>
          </div>
        ))}
      </div>

      {/* ===== SECTION CARDS ===== */}
      <div className="grid md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <Link key={section.name} href={section.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${section.color}`}>
                      <section.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.name}</CardTitle>
                      <p className="text-sm text-stone-500">
                        {section.count} {section.count === 1 ? 'entry' : 'entries'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-stone-600">{section.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* ===== GETTING STARTED (shown when empty) ===== */}
      {isEmpty && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-6 text-center">
            <div className="inline-flex p-3 bg-amber-100 rounded-full mb-4">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800 mb-2">
              Start Building Your World
            </h3>
            <p className="text-stone-600 max-w-md mx-auto mb-4">
              Your story workspace is ready. Begin by adding characters, 
              locations, or jotting down ideas.
            </p>
            <div className="flex justify-center gap-3">
              <Link href={`/story/${story.id}/characters`}>
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <Users className="w-4 h-4 mr-2" />
                  Add Characters
                </Button>
              </Link>
              <Link href={`/story/${story.id}/ideas`}>
                <Button variant="outline">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Capture Ideas
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
