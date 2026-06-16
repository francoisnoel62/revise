// ABOUTME: Tests for autocomplete streaming route
// ABOUTME: Verifies provider metadata is emitted before streamed text chunks

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/infrastructure/auth/auth-config', () => ({
  auth: vi.fn(),
}));

vi.mock('@/infrastructure/config/providers', () => ({
  getProviderRepository: vi.fn(),
  getProjectRepository: vi.fn(),
  getMetadataRepository: vi.fn(),
  getResearchDocumentRepository: vi.fn(),
  getCharacterRepository: vi.fn(),
  getCanonFactRepository: vi.fn(),
}));

vi.mock('@/app/actions/utils', () => ({
  getTrackedLLMProviderById: vi.fn(),
}));

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

describe('POST /api/completion/stream', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);
    vi.mocked(getMetadataRepository).mockResolvedValue({} as never);
    vi.mocked(getResearchDocumentRepository).mockResolvedValue({
      findByProjectId: vi.fn().mockResolvedValue([]),
      findByChapterId: vi.fn().mockResolvedValue([]),
    } as never);
    vi.mocked(getCanonFactRepository).mockResolvedValue({
      findForSelection: vi.fn().mockResolvedValue([]),
    } as never);
    vi.mocked(getCharacterRepository).mockResolvedValue({
      findByProjectId: vi.fn().mockResolvedValue([]),
    } as never);
  });

  it('emits provider metadata before completion chunks', async () => {
    const provider = {
      getId: () => 'provider-1',
      getName: () => 'Claude',
      getType: () => 'anthropic',
      getModel: () => 'claude-sonnet-4-5',
    };
    const project = {
      getProviderId: () => 'provider-1',
      getChapters: () => [],
    };
    const llmProvider = {
      async *generateCompletionStream() {
        yield ' suite';
      },
    };

    vi.mocked(getProviderRepository).mockResolvedValue({
      listProviders: vi.fn().mockResolvedValue([provider]),
    } as never);
    vi.mocked(getProjectRepository).mockResolvedValue({
      loadProject: vi.fn().mockResolvedValue(project),
    } as never);
    vi.mocked(getTrackedLLMProviderById).mockResolvedValue(llmProvider as never);

    const response = await POST(
      request({
        projectId: 'project-1',
        chapterId: 'chapter-1',
        textBeforeCursor: 'Elle ouvrit la porte et',
        textAfterCursor: '',
      })
    );

    expect(response.status).toBe(200);
    const body = await readResponse(response);

    expect(body).toContain(
      'data: {"type":"metadata","providerType":"anthropic","model":"claude-sonnet-4-5","canonFactsCount":0}'
    );
    expect(body.indexOf('"type":"metadata"')).toBeLessThan(body.indexOf('"text":" suite"'));
  });
});
