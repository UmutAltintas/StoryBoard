/** Connections Page - Route: /story/[id]/connections */
'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StoryLayout } from '@/components/layout';
import { ConnectionsPage } from '@/components/features/story';
import { LoginForm } from '@/components/features/auth';

export default function ConnectionsRoute() {
  const params = useParams();
  const storyId = params.id as string;
  const { user } = useAuth();

  if (!user) return <LoginForm />;

  return (
    <StoryLayout storyId={storyId}>
      <ConnectionsPage storyId={storyId} />
    </StoryLayout>
  );
}
