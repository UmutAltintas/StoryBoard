/** Timeline Page - Route: /story/[id]/timeline */
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StoryLayout } from '@/components/layout';
import { TimelinePage } from '@/components/features/story';
import { LoginForm } from '@/components/features/auth';

export default function TimelineRoute() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storyId = params.id as string;
  const selectedId = searchParams.get('selected') || undefined;
  const { user } = useAuth();

  if (!user) return <LoginForm />;

  return (
    <StoryLayout storyId={storyId}>
      <TimelinePage storyId={storyId} selectedId={selectedId} />
    </StoryLayout>
  );
}
