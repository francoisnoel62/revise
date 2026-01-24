// ABOUTME: Public page for reading a shared project.
// ABOUTME: Loads project via share token without authentication.

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { loadPublishedProjectAction } from '@/app/actions/publish-actions';
import { PublicReader } from '@/components/publish/PublicReader';
import { formatReadingTime } from '@/lib/utils';

interface PageProps {
  params: Promise<{ projectId: string; token: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { projectId, token } = await params;
  const result = await loadPublishedProjectAction(projectId, token);

  if (!result.success) {
    return {
      title: 'Projet non trouvé - Revise',
    };
  }

  const totalWords = result.data.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const readingTime = formatReadingTime(totalWords);

  return {
    title: `${result.data.title} - Revise`,
    description: `Lisez "${result.data.title}" sur Revise. ${result.data.chapters.length} chapitre${result.data.chapters.length > 1 ? 's' : ''}, ${readingTime} de lecture.`,
    openGraph: {
      title: result.data.title,
      description: `${result.data.chapters.length} chapitre${result.data.chapters.length > 1 ? 's' : ''}, ${readingTime} de lecture`,
      type: 'article',
    },
  };
}

export default async function PublicReadPage({ params }: PageProps) {
  const { projectId, token } = await params;
  const result = await loadPublishedProjectAction(projectId, token);

  if (!result.success) {
    notFound();
  }

  return <PublicReader project={result.data} />;
}
