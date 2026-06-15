// ABOUTME: Authenticated API endpoint for autocomplete telemetry statistics
// ABOUTME: Returns project-scoped lifecycle metrics with ownerId isolation

import { NextRequest } from 'next/server';
import { auth } from '@/infrastructure/auth/auth-config';
import { getAutocompleteEventRepo } from '@/app/actions/utils';

export const runtime = 'nodejs';

function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) {
    return new Response('Missing projectId', { status: 400 });
  }

  const repo = await getAutocompleteEventRepo();
  const stats = await repo.getStatsByProject(session.user.id, projectId, {
    startDate: parseDateParam(searchParams.get('startDate')),
    endDate: parseDateParam(searchParams.get('endDate')),
  });

  return Response.json(stats);
}
