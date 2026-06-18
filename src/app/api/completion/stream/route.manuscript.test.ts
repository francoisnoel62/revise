// ABOUTME: Tests that previous chapters are injected as [CHAPITRES PRÉCÉDENTS] in the prompt
// ABOUTME: Covers the 40k threshold via the route wiring

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/infrastructure/auth/auth-config', () => ({ auth: vi.fn() }));

vi.mock('@/infrastructure/config/providers', () => ({
  getProviderRepository: vi.fn(),
  getProjectRepository: vi.fn(),
  getCharacterRepository: vi.fn(),
  getCanonFactRepository: vi.fn(),
}));

vi.mock('@/app/actions/utils', () => ({
  getTrackedLLMProviderById: vi.fn(),
  getRateLimitRepo: vi.fn(),
}));

import { auth } from '@/infrastructure/auth/auth-config';
import {
  getProviderRepository,
  getProjectRepository,
  getCharacterRepository,
  getCanonFactRepository,
} from '@/infrastructure/config/providers';
import { getTrackedLLMProviderById, getRateLimitRepo } from '@/app/actions/utils';
import { POST } from './route';

function tipTapChapter(title: string, text: string) {
  const content = JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  });
  return { getId: () => title, getTitle: () => title, getContent: () => content, getOrder: () => 0 };
}

function request(body: unknown) {
  return new NextRequest('http://localhost/api/completion/stream', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/completion/stream — manuscript context', () => {
  let capturedContext: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedContext = undefined;

    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
    vi.mocked(getRateLimitRepo).mockResolvedValue({
      consumeFixedWindow: vi.fn().mockResolvedValue({ allowed: true }),
    } as never);
    vi.mocked(getCharacterRepository).mockResolvedValue({
      findByProjectId: vi.fn().mockResolvedValue([]),
    } as never);
    vi.mocked(getCanonFactRepository).mockResolvedValue({
      findForSelection: vi.fn().mockResolvedValue([]),
    } as never);

    const provider = {
      getId: () => 'provider-1',
      getName: () => 'Claude',
      getType: () => 'anthropic',
      getModel: () => 'claude-sonnet-4-5',
    };
    vi.mocked(getProviderRepository).mockResolvedValue({
      listProviders: vi.fn().mockResolvedValue([provider]),
    } as never);

    const llmProvider = {
      async *generateCompletionStream(
        _before: string,
        _after: string | undefined,
        projectContext?: string
      ) {
        capturedContext = projectContext;
        yield ' suite';
      },
    };
    vi.mocked(getTrackedLLMProviderById).mockResolvedValue(llmProvider as never);
  });

  it('injects [CHAPITRES PRÉCÉDENTS] from chapters before the current one', async () => {
    const chapters = [
      tipTapChapter('Prologue', 'Il était une fois dans une ville lointaine.'),
      tipTapChapter('Chapitre 1', 'Le héros arriva au carrefour.'),
    ];

    vi.mocked(getProjectRepository).mockResolvedValue({
      loadProject: vi.fn().mockResolvedValue({
        getProviderId: () => 'provider-1',
        getChapters: () => chapters,
      }),
    } as never);

    const response = await POST(
      request({
        projectId: 'project-1',
        chapterId: 'Chapitre 1', // index 1 → Prologue is previous
        textBeforeCursor: 'Il continua sa route',
      })
    );

    expect(response.status).toBe(200);
    expect(capturedContext).toContain('[CHAPITRES PRÉCÉDENTS]');
    expect(capturedContext).toContain('Prologue');
    expect(capturedContext).not.toContain('Chapitre 1');
  });

  it('omits [CHAPITRES PRÉCÉDENTS] when there are no previous chapters', async () => {
    const chapters = [
      tipTapChapter('Chapitre 1', 'Le héros arriva au carrefour.'),
    ];

    vi.mocked(getProjectRepository).mockResolvedValue({
      loadProject: vi.fn().mockResolvedValue({
        getProviderId: () => 'provider-1',
        getChapters: () => chapters,
      }),
    } as never);

    const response = await POST(
      request({
        projectId: 'project-1',
        chapterId: 'Chapitre 1', // first chapter, no previous
        textBeforeCursor: 'Il continua sa route',
      })
    );

    expect(response.status).toBe(200);
    expect(capturedContext ?? '').not.toContain('[CHAPITRES PRÉCÉDENTS]');
  });
});
