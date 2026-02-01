/**
 * Graph Page - Visual relationship graph for all story elements
 */

import { GraphPage } from '@/components/features/story/GraphPage';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Graph({ params }: Props) {
  const { id } = await params;
  return <GraphPage storyId={id} />;
}
