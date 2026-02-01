/**
 * Chapters Page - Write and manage story chapters
 */

import { ChaptersPage } from '@/components/features/story/ChaptersPage';
import { StoryLayout } from '@/components/layout';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChaptersRoute({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <StoryLayout storyId={id}>
      <ChaptersPage storyId={id} />
    </StoryLayout>
  );
}
