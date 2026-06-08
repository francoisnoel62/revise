// ABOUTME: Tests for character conversation server actions
// ABOUTME: Verifies create, list, load, delete operations with auth protection

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createConversationAction,
  listConversationsAction,
  loadConversationAction,
  deleteConversationAction,
} from '../character-conversation-actions';

vi.mock('../utils', () => ({
  getAuthenticatedUserId: vi.fn(),
  getCharacterConversationRepo: vi.fn(),
  getIdGenerator: vi.fn(),
}));

import { getAuthenticatedUserId, getCharacterConversationRepo, getIdGenerator } from '../utils';

const makeConvEntity = (overrides: Record<string, unknown> = {}) => ({
  getId: vi.fn().mockReturnValue('conv-1'),
  getCharacterId: vi.fn().mockReturnValue('char-1'),
  getProjectId: vi.fn().mockReturnValue('proj-1'),
  getMessages: vi.fn().mockReturnValue([]),
  getUpdatedAt: vi.fn().mockReturnValue(new Date('2024-01-01')),
  ...overrides,
});

const makeRepo = (overrides: Record<string, unknown> = {}) => ({
  create: vi.fn().mockImplementation(async (_userId: string, conv: unknown) => conv),
  findByCharacterId: vi.fn().mockResolvedValue([]),
  findById: vi.fn().mockResolvedValue(null),
  delete: vi.fn().mockResolvedValue(undefined),
  update: vi.fn(),
  deleteByCharacterId: vi.fn(),
  deleteByProjectId: vi.fn(),
  deleteAllByOwner: vi.fn(),
  ...overrides,
});

describe('createConversationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getIdGenerator).mockResolvedValue({ generate: vi.fn().mockReturnValue('new-id') });
  });

  it('returns a serialized conversation on success', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    const saved = makeConvEntity();
    vi.mocked(getCharacterConversationRepo).mockResolvedValue(makeRepo({ create: vi.fn().mockResolvedValue(saved) }) as never);

    const result = await createConversationAction('proj-1', 'char-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('conv-1');
      expect(result.data.characterId).toBe('char-1');
    }
  });

  it('returns error when not authenticated', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({
      error: { success: false, error: 'Non authentifié' },
    });

    const result = await createConversationAction('proj-1', 'char-1');

    expect(result.success).toBe(false);
  });
});

describe('listConversationsAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns conversations sorted by updatedAt descending', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    const older = makeConvEntity({ getId: vi.fn().mockReturnValue('conv-old'), getUpdatedAt: vi.fn().mockReturnValue(new Date('2024-01-01')) });
    const newer = makeConvEntity({ getId: vi.fn().mockReturnValue('conv-new'), getUpdatedAt: vi.fn().mockReturnValue(new Date('2024-06-01')) });
    vi.mocked(getCharacterConversationRepo).mockResolvedValue(makeRepo({ findByCharacterId: vi.fn().mockResolvedValue([older, newer]) }) as never);

    const result = await listConversationsAction('char-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].id).toBe('conv-new');
      expect(result.data[1].id).toBe('conv-old');
    }
  });

  it('returns error when not authenticated', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({
      error: { success: false, error: 'Non authentifié' },
    });

    const result = await listConversationsAction('char-1');

    expect(result.success).toBe(false);
  });
});

describe('loadConversationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns serialized messages for an existing conversation', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    const msg = { getRole: vi.fn().mockReturnValue('author'), getContent: vi.fn().mockReturnValue('Hello'), getCreatedAt: vi.fn().mockReturnValue(new Date()) };
    const conv = makeConvEntity({ getMessages: vi.fn().mockReturnValue([msg]) });
    vi.mocked(getCharacterConversationRepo).mockResolvedValue(makeRepo({ findById: vi.fn().mockResolvedValue(conv) }) as never);

    const result = await loadConversationAction('conv-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].role).toBe('author');
      expect(result.data[0].content).toBe('Hello');
    }
  });

  it('returns error when conversation not found', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    vi.mocked(getCharacterConversationRepo).mockResolvedValue(makeRepo({ findById: vi.fn().mockResolvedValue(null) }) as never);

    const result = await loadConversationAction('missing');

    expect(result.success).toBe(false);
  });

  it('returns error when not authenticated', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({
      error: { success: false, error: 'Non authentifié' },
    });

    const result = await loadConversationAction('conv-1');

    expect(result.success).toBe(false);
  });
});

describe('deleteConversationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the conversation and returns success', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    vi.mocked(getCharacterConversationRepo).mockResolvedValue(makeRepo({ delete: mockDelete }) as never);

    const result = await deleteConversationAction('conv-1');

    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith('user-1', 'conv-1');
  });

  it('returns error when not authenticated', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({
      error: { success: false, error: 'Non authentifié' },
    });

    const result = await deleteConversationAction('conv-1');

    expect(result.success).toBe(false);
  });
});
