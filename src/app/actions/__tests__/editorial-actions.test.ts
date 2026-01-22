// ABOUTME: Tests for editorial server actions
// ABOUTME: Verifies editorial annex CRUD operations

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listEditorialAnnexesAction,
  getEditorialAnnexAction,
  saveEditorialAnnexAction,
  deleteEditorialAnnexAction,
  getEditorialAnnexCountAction,
} from '../editorial-actions';

// Mock the utils module
vi.mock('../utils', () => ({
  getAuthenticatedUserId: vi.fn(),
  getMetadataRepo: vi.fn(),
  getRepository: vi.fn(),
  getIdGenerator: vi.fn(),
  withErrorHandling: vi.fn(async (fn: () => Promise<unknown>) => {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }),
}));

import {
  getAuthenticatedUserId,
  getMetadataRepo,
  getRepository,
  getIdGenerator,
} from '../utils';

describe('listEditorialAnnexesAction', () => {
  const mockMetadataRepo = {
    findByProjectAndType: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMetadataRepo).mockResolvedValue(
      mockMetadataRepo as unknown as Awaited<ReturnType<typeof getMetadataRepo>>
    );
  });

  it('returns list of editorial annexes when authenticated', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    mockMetadataRepo.findByProjectAndType.mockResolvedValue(null);

    const result = await listEditorialAnnexesAction('project-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(8);
      expect(result.data[0].type).toBe('dedication');
      expect(result.data[0].hasContent).toBe(false);
    }
  });

  it('returns error when not authenticated', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({
      error: { success: false, error: 'Non authentifié' },
    });

    const result = await listEditorialAnnexesAction('project-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Non authentifié');
    }
  });

  it('marks annexes with content as hasContent=true', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    mockMetadataRepo.findByProjectAndType.mockImplementation(
      async (_userId: string, _projectId: string, type: string) => {
        if (type === 'dedication') {
          return {
            getId: () => 'meta-1',
            getProjectId: () => 'project-1',
            getTypeKey: () => 'dedication',
            getContent: () =>
              JSON.stringify({
                type: 'doc',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'À ma famille' }] }],
              }),
            getProperties: () => ({
              wordCount: 10,
              characterCount: 50,
              lastEdited: new Date(),
              generatedAt: null,
              isGenerated: false,
            }),
          };
        }
        return null;
      }
    );

    const result = await listEditorialAnnexesAction('project-1');

    expect(result.success).toBe(true);
    if (result.success) {
      const dedication = result.data.find((a) => a.type === 'dedication');
      expect(dedication?.hasContent).toBe(true);
    }
  });
});

describe('getEditorialAnnexAction', () => {
  const mockMetadataRepo = {
    findByProjectAndType: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMetadataRepo).mockResolvedValue(
      mockMetadataRepo as unknown as Awaited<ReturnType<typeof getMetadataRepo>>
    );
  });

  it('returns annex data when authenticated', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    mockMetadataRepo.findByProjectAndType.mockResolvedValue(null);

    const result = await getEditorialAnnexAction('project-1', 'dedication');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('dedication');
      expect(result.data.title).toBe('Dédicace');
    }
  });

  it('returns error for invalid type', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });

    const result = await getEditorialAnnexAction('project-1', 'invalid-type');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Type éditorial invalide');
    }
  });

  it('returns error when not authenticated', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({
      error: { success: false, error: 'Non authentifié' },
    });

    const result = await getEditorialAnnexAction('project-1', 'dedication');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Non authentifié');
    }
  });
});

describe('saveEditorialAnnexAction', () => {
  const mockMetadataRepo = {
    findByProjectAndType: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const mockProjectRepo = {
    loadProject: vi.fn(),
  };
  const mockIdGenerator = {
    generate: vi.fn(() => 'new-id'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMetadataRepo).mockResolvedValue(
      mockMetadataRepo as unknown as Awaited<ReturnType<typeof getMetadataRepo>>
    );
    vi.mocked(getRepository).mockResolvedValue(
      mockProjectRepo as unknown as Awaited<ReturnType<typeof getRepository>>
    );
    vi.mocked(getIdGenerator).mockResolvedValue(mockIdGenerator);
  });

  it('creates new annex when none exists', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    mockProjectRepo.loadProject.mockResolvedValue({ getId: () => 'project-1' });
    mockMetadataRepo.findByProjectAndType.mockResolvedValue(null);

    const content = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'À ma famille' }] }],
    });

    const result = await saveEditorialAnnexAction('project-1', 'dedication', content);

    expect(result.success).toBe(true);
    expect(mockMetadataRepo.create).toHaveBeenCalled();
  });

  it('updates existing annex', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    mockProjectRepo.loadProject.mockResolvedValue({ getId: () => 'project-1' });

    const existingMeta = {
      getId: () => 'meta-1',
      getProjectId: () => 'project-1',
      getTypeKey: () => 'dedication',
      getContent: () => JSON.stringify({ type: 'doc', content: [] }),
      getProperties: () => ({
        wordCount: 0,
        characterCount: 0,
        lastEdited: new Date(),
        generatedAt: null,
        isGenerated: false,
      }),
      updateContent: vi.fn(),
    };
    mockMetadataRepo.findByProjectAndType.mockResolvedValue(existingMeta);

    const content = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'À ma famille' }] }],
    });

    const result = await saveEditorialAnnexAction('project-1', 'dedication', content);

    expect(result.success).toBe(true);
    expect(existingMeta.updateContent).toHaveBeenCalledWith(content);
    expect(mockMetadataRepo.update).toHaveBeenCalled();
  });

  it('returns error for invalid type', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });

    const result = await saveEditorialAnnexAction('project-1', 'invalid-type', '{}');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Type éditorial invalide');
    }
  });

  it('returns error when project not found', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    mockProjectRepo.loadProject.mockResolvedValue(null);

    const result = await saveEditorialAnnexAction(
      'project-1',
      'dedication',
      JSON.stringify({ type: 'doc', content: [] })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Projet non trouvé');
    }
  });
});

describe('deleteEditorialAnnexAction', () => {
  const mockMetadataRepo = {
    findByProjectAndType: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMetadataRepo).mockResolvedValue(
      mockMetadataRepo as unknown as Awaited<ReturnType<typeof getMetadataRepo>>
    );
  });

  it('deletes existing annex', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    mockMetadataRepo.findByProjectAndType.mockResolvedValue({
      getId: () => 'meta-1',
    });

    const result = await deleteEditorialAnnexAction('project-1', 'dedication');

    expect(result.success).toBe(true);
    expect(mockMetadataRepo.delete).toHaveBeenCalledWith('user-1', 'meta-1');
  });

  it('succeeds when annex does not exist', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    mockMetadataRepo.findByProjectAndType.mockResolvedValue(null);

    const result = await deleteEditorialAnnexAction('project-1', 'dedication');

    expect(result.success).toBe(true);
    expect(mockMetadataRepo.delete).not.toHaveBeenCalled();
  });

  it('returns error for invalid type', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });

    const result = await deleteEditorialAnnexAction('project-1', 'invalid-type');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Type éditorial invalide');
    }
  });
});

describe('getEditorialAnnexCountAction', () => {
  const mockMetadataRepo = {
    findByProjectAndType: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMetadataRepo).mockResolvedValue(
      mockMetadataRepo as unknown as Awaited<ReturnType<typeof getMetadataRepo>>
    );
  });

  it('returns correct count', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    mockMetadataRepo.findByProjectAndType.mockImplementation(
      async (_userId: string, _projectId: string, type: string) => {
        if (type === 'dedication' || type === 'preface') {
          return {
            getContent: () =>
              JSON.stringify({
                type: 'doc',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Content' }] }],
              }),
          };
        }
        return null;
      }
    );

    const result = await getEditorialAnnexCountAction('project-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(2);
      expect(result.data.total).toBe(8);
    }
  });

  it('returns 0 when no annexes have content', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' });
    mockMetadataRepo.findByProjectAndType.mockResolvedValue(null);

    const result = await getEditorialAnnexCountAction('project-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(0);
      expect(result.data.total).toBe(8);
    }
  });

  it('returns error when not authenticated', async () => {
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({
      error: { success: false, error: 'Non authentifié' },
    });

    const result = await getEditorialAnnexCountAction('project-1');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Non authentifié');
    }
  });
});
