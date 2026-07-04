// ABOUTME: Streams the cached whole-book preview PDF from GridFS for the authenticated owner.
// ABOUTME: Thin reader — getBookPreviewDataAction warms the cache before the iframe requests this.

import { NextRequest } from 'next/server';
import { auth } from '@/infrastructure/auth/auth-config';
import { getBookPreviewCacheRepo } from '@/app/actions/utils';
import { BOOK_PREVIEW_PROFILES, type BookPreviewProfileId } from '@/app/actions/book-preview-actions';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project');
  const profile = searchParams.get('profile');

  if (!projectId) {
    return new Response('Missing project', { status: 400 });
  }
  if (!profile || !(BOOK_PREVIEW_PROFILES as readonly string[]).includes(profile)) {
    return new Response('Invalid profile', { status: 400 });
  }

  const repo = await getBookPreviewCacheRepo();
  const pdf = await repo.loadPdf(projectId, profile as BookPreviewProfileId, session.user.id);
  if (!pdf) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="apercu-livre.pdf"',
      'Cache-Control': 'private, no-store',
    },
  });
}
