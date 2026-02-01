/** Ideas Page - Route: /story/[id]/ideas */
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StoryLayout } from '@/components/layout';
import { IdeasPage } from '@/components/features/story';
import { LoginForm } from '@/components/features/auth';

export default function IdeasRoute() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storyId = params.id as string;
  const selectedId = searchParams.get('selected') || undefined;
  const { user } = useAuth();

  if (!user) return <LoginForm />;

  return (
    <StoryLayout storyId={storyId}>
      <IdeasPage storyId={storyId} selectedId={selectedId} />
    </StoryLayout>
  );
}
