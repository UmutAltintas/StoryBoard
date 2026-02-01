/**
 * Story Overview Page
 * Route: /story/[id]
 */

'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useStoryBoardStore } from '@/lib/store';
import { StoryLayout } from '@/components/layout';
import { StoryOverview } from '@/components/features/story';
import { LoginForm } from '@/components/features/auth';

export default function StoryPage() {
  const params = useParams();
  const storyId = params.id as string;
  const { user } = useAuth();
  const { getStory } = useStoryBoardStore();

  // Require login
  if (!user) return <LoginForm />;

  const story = getStory(storyId);

  // Handle missing story
  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Story not found</h2>
          <p className="text-stone-500">The story you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <StoryLayout storyId={storyId}>
      <StoryOverview story={story} />
    </StoryLayout>
  );
}
