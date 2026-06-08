// ABOUTME: Tests for the character-chat SSE streaming route
// ABOUTME: Verifies auth guard, input validation, and SSE event format

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/infrastructure/auth/auth-config', () => ({
  auth: vi.fn(),
}));

vi.mock('@/infrastructure/config/providers', () => ({
  getCharacterConversationRepository: vi.fn(),
  getCharacterRepository: vi.fn(),
  getMetadataRepository: vi.fn(),
  getProjectRepository: vi.fn(),
  getProviderRepository: vi.fn(),
  createLLMProvider: vi.fn(),
}));

vi.mock('@/application/use-cases/ChatWithCharacterUseCase', () => ({
  ChatWithCharacterUseCase: vi.fn(),
}));

import { auth } from '@/infrastructure/auth/auth-config';
import {
  getCharacterConversationRepository,
  getCharacterRepository,
  getMetadataRepository,
  getProjectRepository,
  getProviderRepository,
  createLLMProvider,
} from '@/infrastructure/config/providers';
import { ChatWithCharacterUseCase } from '@/application/use-cases/ChatWithCharacterUseCase';
import { POST } from '../stream/route';

const makeRequest = (body: Record<string, unknown>) =>
  new NextRequest('http://localhost/api/character-chat/stream', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

async function readSSEStream(response: Response): Promise<string[]> {
  const text = await response.text();
  return text
    .split('\n')
    .filter((line) => line.startsWith('data: '))
    .map((line) => line.slice(6));
}

describe('POST /api/character-chat/stream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const response = await POST(makeRequest({ projectId: 'p1', characterId: 'c1', message: 'hi' }));

    expect(response.status).toBe(401);
  });

  it('returns 400 when message is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);

    const response = await POST(makeRequest({ projectId: 'p1', characterId: 'c1' }));

    expect(response.status).toBe(400);
  });

  it('returns 400 when projectId is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);

    const response = await POST(makeRequest({ characterId: 'c1', message: 'hi' }));

    expect(response.status).toBe(400);
  });

  it('sends meta event with conversationId as first SSE line', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as never);

    const mockConv = {
      getId: vi.fn().mockReturnValue('new-conv-id'),
      getMessages: vi.fn().mockReturnValue([]),
      addMessage: vi.fn().mockReturnThis(),
      getUpdatedAt: vi.fn().mockReturnValue(new Date()),
      getOwnerId: vi.fn().mockReturnValue('user-1'),
      getProjectId: vi.fn().mockReturnValue('proj-1'),
      getCharacterId: vi.fn().mockReturnValue('char-1'),
      getCreatedAt: vi.fn().mockReturnValue(new Date()),
    };
    const mockConvRepo = {
      create: vi.fn().mockResolvedValue(mockConv),
      findById: vi.fn().mockResolvedValue(mockConv),
      findByCharacterId: vi.fn(),
      update: vi.fn().mockResolvedValue(mockConv),
      delete: vi.fn(),
      deleteByCharacterId: vi.fn(),
      deleteByProjectId: vi.fn(),
      deleteAllByOwner: vi.fn(),
    };
    vi.mocked(getCharacterConversationRepository).mockResolvedValue(mockConvRepo as never);
    vi.mocked(getCharacterRepository).mockResolvedValue({} as never);
    vi.mocked(getMetadataRepository).mockResolvedValue({ findByProjectId: vi.fn().mockResolvedValue([]) } as never);

    const mockProject = { getProviderId: vi.fn().mockReturnValue('prov-1') };
    vi.mocked(getProjectRepository).mockResolvedValue({ loadProject: vi.fn().mockResolvedValue(mockProject) } as never);

    const mockProvider = { isValidProvider: vi.fn().mockReturnValue(true) };
    vi.mocked(getProviderRepository).mockResolvedValue({ findById: vi.fn().mockResolvedValue(mockProvider) } as never);
    vi.mocked(createLLMProvider).mockReturnValue({ chatStream: async function*() {} } as never);

    async function* fakeGen() { yield 'Hello'; yield ' world'; }
    vi.mocked(ChatWithCharacterUseCase).mockImplementation(function(this: unknown) {
      (this as { execute: unknown }).execute = vi.fn().mockReturnValue(fakeGen());
    } as never);

    const response = await POST(
      makeRequest({ projectId: 'proj-1', characterId: 'char-1', conversationId: null, message: 'hi' })
    );

    expect(response.status).toBe(200);
    const lines = await readSSEStream(response);
    expect(lines[0]).toContain('"type":"meta"');
    expect(lines[0]).toContain('"conversationId"');
    expect(lines.some((l) => l.includes('"type":"chunk"'))).toBe(true);
    expect(lines[lines.length - 1]).toBe('[DONE]');
  });
});
