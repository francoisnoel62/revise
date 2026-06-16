// ABOUTME: Tests the completion route canon wiring when CANON_CONTEXT_ENABLED is on
// ABOUTME: Verifies local entity detection feeds [CANON] into the prompt and canonFactsCount

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/infrastructure/auth/auth-config', () => ({ auth: vi.fn() }));

vi.mock('@/lib/ai-feature-flags', () => ({
  CANON_CONTEXT_ENABLED: true,
  LONG_FORM_GENERATION_ENABLED: false,
}));

vi.mock('@/infrastructure/config/providers', () => ({
  getProviderRepository: vi.fn(),
  getProjectRepository: vi.fn(),
  getMetadataRepository: vi.fn(),
  getResearchDocumentRepository: vi.fn(),
  getCharacterRepository: vi.fn(),
  getCanonFactRepository: vi.fn(),
}));

vi.mock('@/app/actions/utils', () => ({ getTrackedLLMProviderById: vi.fn() }));

import { auth } from '@/infrastructure/auth/auth-config';
import {
  getProviderRepository,
  getProjectRepository,
  getMetadataRepository,
  getResearchDocumentRepository,
  getCharacterRepository,
  getCanonFactRepository,
} from '@/infrastructure/config/providers';
import { getTrackedLLMProviderById } from '@/app/actions/utils';
import { POST } from './route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/completion/stream', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

async function readResponse(response: Response): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value);
  }
  return text;
}

describe('POST /api/completion/stream — canon enabled', () => {
  let capturedContext: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    capturedContext = undefined;

    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
    vi.mocked(getMetadataRepository).mockResolvedValue({} as never);
    vi.mocked(getResearchDocumentRepository).mockResolvedValue({
      findByProjectId: vi.fn().mockResolvedValue([]),
      findByChapterId: vi.fn().mockResolvedValue([]),
    } as never);

    const provider = {
      getId: () => 'provider-1',
      getName: () => 'Claude',
      getType: () => 'anthropic',
      getModel: () => 'claude-sonnet-4-5',
    };
    const chapters = [
      { getId: () => 'chapter-0', getTitle: () => 'Un', getContent: () => '{}', getOrder: () => 0 },
      { getId: () => 'chapter-1', getTitle: () => 'Deux', getContent: () => '{}', getOrder: () => 1 },
    ];
    vi.mocked(getProviderRepository).mockResolvedValue({
      listProviders: vi.fn().mockResolvedValue([provider]),
    } as never);
    vi.mocked(getProjectRepository).mockResolvedValue({
      loadProject: vi.fn().mockResolvedValue({
        getProviderId: () => 'provider-1',
        getChapters: () => chapters,
      }),
    } as never);
    vi.mocked(getCharacterRepository).mockResolvedValue({
      findByProjectId: vi.fn().mockResolvedValue([{ getName: () => 'Léa' }]),
    } as never);
    vi.mocked(getCanonFactRepository).mockResolvedValue({
      findForSelection: vi.fn().mockResolvedValue([
        { getEntity: () => 'Léa', getStatement: () => 'est morte', getValidFromChapter: () => 0 },
      ]),
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

  it('injects [CANON] for a locally-present character and reports the count', async () => {
    const response = await POST(
      request({
        projectId: 'project-1',
        chapterId: 'chapter-1',
        textBeforeCursor: 'Léa entra dans la pièce et',
        textAfterCursor: '',
      })
    );

    expect(response.status).toBe(200);
    const body = await readResponse(response);

    expect(capturedContext).toContain('[CANON]');
    expect(capturedContext).toContain('Léa : est morte');
    expect(body).toContain('"canonFactsCount":1');
  });

  it('omits [CANON] when no known character is present in the local window', async () => {
    const response = await POST(
      request({
        projectId: 'project-1',
        chapterId: 'chapter-1',
        textBeforeCursor: 'Il marchait seul et',
        textAfterCursor: '',
      })
    );

    const body = await readResponse(response);
    expect(capturedContext ?? '').not.toContain('[CANON]');
    expect(body).toContain('"canonFactsCount":0');
  });
});
