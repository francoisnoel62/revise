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
  getRateLimitRepo: vi.fn(),
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
import { getTrackedLLMProviderById, getRateLimitRepo } from '@/app/actions/utils';
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
    vi.mocked(getRateLimitRepo).mockResolvedValue({
      consumeFixedWindow: vi.fn().mockResolvedValue({ allowed: true }),
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

  it('returns 429 when the per-user completion budget is exceeded', async () => {
    vi.mocked(getRateLimitRepo).mockResolvedValue({
      consumeFixedWindow: vi
        .fn()
        .mockResolvedValue({ allowed: false, retryAfterSeconds: 30 }),
    } as never);

    const response = await POST(
      request({ projectId: 'project-1', textBeforeCursor: 'Elle ouvrit' })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('30');
  });

  it('charges manual completions to the completion bucket', async () => {
    const consume = vi.fn().mockResolvedValue({ allowed: true });
    vi.mocked(getRateLimitRepo).mockResolvedValue({ consumeFixedWindow: consume } as never);

    const provider = {
      getId: () => 'provider-1',
      getName: () => 'Claude',
      getType: () => 'anthropic',
      getModel: () => 'claude-sonnet-4-5',
    };
    const project = { getProviderId: () => 'provider-1', getChapters: () => [] };
    vi.mocked(getProviderRepository).mockResolvedValue({
      listProviders: vi.fn().mockResolvedValue([provider]),
    } as never);
    vi.mocked(getProjectRepository).mockResolvedValue({
      loadProject: vi.fn().mockResolvedValue(project),
    } as never);
    vi.mocked(getTrackedLLMProviderById).mockResolvedValue({
      async *generateCompletionStream() {
        yield ' x';
      },
    } as never);

    await readResponse(
      await POST(request({ projectId: 'project-1', textBeforeCursor: 'Elle ouvrit' }))
    );

    expect(consume).toHaveBeenCalledWith('completion:user-1', expect.any(Number), 60);
  });

  it('charges prefetch to a separate, smaller bucket', async () => {
    const consume = vi.fn().mockResolvedValue({ allowed: true });
    vi.mocked(getRateLimitRepo).mockResolvedValue({ consumeFixedWindow: consume } as never);

    const provider = {
      getId: () => 'provider-1',
      getName: () => 'Claude',
      getType: () => 'anthropic',
      getModel: () => 'claude-sonnet-4-5',
    };
    const project = { getProviderId: () => 'provider-1', getChapters: () => [] };
    vi.mocked(getProviderRepository).mockResolvedValue({
      listProviders: vi.fn().mockResolvedValue([provider]),
    } as never);
    vi.mocked(getProjectRepository).mockResolvedValue({
      loadProject: vi.fn().mockResolvedValue(project),
    } as never);
    vi.mocked(getTrackedLLMProviderById).mockResolvedValue({
      async *generateCompletionStream() {
        yield ' x';
      },
    } as never);

    await readResponse(
      await POST(
        request({
          projectId: 'project-1',
          textBeforeCursor: 'Elle ouvrit',
          isPrefetch: true,
        })
      )
    );

    expect(consume).toHaveBeenCalledWith('prefetch:user-1', expect.any(Number), 20);
  });

  it('429s an over-budget prefetch without touching the manual bucket', async () => {
    const consume = vi.fn().mockResolvedValue({ allowed: false, retryAfterSeconds: 12 });
    vi.mocked(getRateLimitRepo).mockResolvedValue({ consumeFixedWindow: consume } as never);

    const response = await POST(
      request({ projectId: 'project-1', textBeforeCursor: 'Elle ouvrit', isPrefetch: true })
    );

    expect(response.status).toBe(429);
    expect(consume).toHaveBeenCalledTimes(1);
    expect(consume).toHaveBeenCalledWith('prefetch:user-1', expect.any(Number), 20);
  });

  it('rejects an oversized textBeforeCursor before calling the provider', async () => {
    const getTracked = vi.mocked(getTrackedLLMProviderById);

    const response = await POST(
      request({ projectId: 'project-1', textBeforeCursor: 'x'.repeat(8001) })
    );

    expect(response.status).toBe(413);
    expect(getTracked).not.toHaveBeenCalled();
  });

  it('injects length and audace directives into the provider context', async () => {
    const contexts: string[] = [];
    const provider = {
      getId: () => 'provider-1',
      getName: () => 'Claude',
      getType: () => 'anthropic',
      getModel: () => 'claude-sonnet-4-5',
    };
    const project = { getProviderId: () => 'provider-1', getChapters: () => [] };
    const llmProvider = {
      async *generateCompletionStream(
        _before: string,
        _after: string | undefined,
        context: string
      ) {
        contexts.push(context);
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
        textBeforeCursor: 'Elle ouvrit la porte et',
        textAfterCursor: '',
        suggestionLength: 'short',
        audace: 'bold',
      })
    );
    await readResponse(response);

    expect(contexts[0]).toContain('[LONGUEUR DEMANDÉE]');
    expect(contexts[0]).toContain('[AUDACE DEMANDÉE]');
  });

  it('omits preference directives for default/invalid values', async () => {
    const contexts: string[] = [];
    const provider = {
      getId: () => 'provider-1',
      getName: () => 'Claude',
      getType: () => 'anthropic',
      getModel: () => 'claude-sonnet-4-5',
    };
    const project = { getProviderId: () => 'provider-1', getChapters: () => [] };
    const llmProvider = {
      async *generateCompletionStream(
        _before: string,
        _after: string | undefined,
        context: string
      ) {
        contexts.push(context);
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
        textBeforeCursor: 'Elle ouvrit la porte et',
        suggestionLength: 'medium',
        audace: 'not-a-level',
      })
    );
    await readResponse(response);

    expect(contexts[0]).not.toContain('[LONGUEUR DEMANDÉE]');
    expect(contexts[0]).not.toContain('[AUDACE DEMANDÉE]');
  });

  it('does not leak the raw provider error message to the client', async () => {
    const provider = {
      getId: () => 'provider-1',
      getName: () => 'Claude',
      getType: () => 'anthropic',
      getModel: () => 'claude-sonnet-4-5',
    };
    const project = { getProviderId: () => 'provider-1', getChapters: () => [] };
    const secret = 'Anthropic 401: invalid x-api-key sk-ant-SECRET';
    const llmProvider = {
      // eslint-disable-next-line require-yield
      async *generateCompletionStream() {
        throw new Error(secret);
      },
    };

    vi.mocked(getProviderRepository).mockResolvedValue({
      listProviders: vi.fn().mockResolvedValue([provider]),
    } as never);
    vi.mocked(getProjectRepository).mockResolvedValue({
      loadProject: vi.fn().mockResolvedValue(project),
    } as never);
    vi.mocked(getTrackedLLMProviderById).mockResolvedValue(llmProvider as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await POST(
      request({
        projectId: 'project-1',
        chapterId: 'chapter-1',
        textBeforeCursor: 'Elle ouvrit la porte et',
        textAfterCursor: '',
      })
    );

    const body = await readResponse(response);

    // The client gets a generic message; the secret stays server-side only.
    expect(body).toContain('"error"');
    expect(body).not.toContain(secret);
    expect(body).not.toContain('sk-ant-SECRET');
    // The full detail is still logged for server-side debugging.
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
