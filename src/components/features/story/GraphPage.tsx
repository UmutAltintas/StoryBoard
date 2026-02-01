/**
 * GraphPage.tsx - Visual relationship graph for story elements
 * 
 * Shows connections between characters, locations, and other story elements
 * as an interactive node graph.
 */

'use client';

import { useStoryBoardStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Network } from 'lucide-react';

interface GraphPageProps {
  storyId: string;
}

export function GraphPage({ storyId }: GraphPageProps) {
  const { getCharactersByStory, relationships } = useStoryBoardStore();
  const characters = getCharactersByStory(storyId);
  const storyRelationships = relationships.filter(r => r.storyId === storyId);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
          <Network className="w-6 h-6" />
          Relationship Graph
        </h1>
        <p className="text-stone-500 mt-1">
          Visualize connections between your story elements
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-stone-400">
          <Network className="w-16 h-16 mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-stone-600">Coming Soon</h3>
          <p className="text-sm text-center max-w-md mt-2">
            The interactive relationship graph is under development. 
            It will show visual connections between {characters.length} characters 
            and {storyRelationships.length} relationships.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default GraphPage;
