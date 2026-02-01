/**
 * Tags Page - Manage custom tags for story organization
 */

import { TagsPage } from '@/components/features/story/TagsPage';
import { StoryLayout } from '@/components/layout';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TagsRoute({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <StoryLayout storyId={id}>
      <TagsPage storyId={id} />
    </StoryLayout>
  );
}
