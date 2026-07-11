// ABOUTME: Tests for custom annex server actions (CRUD + reorder).
// ABOUTME: Repository and project access are mocked; verifies ownership and ordering rules.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listCustomAnnexesAction,
  createCustomAnnexAction,
  updateCustomAnnexAction,
  deleteCustomAnnexAction,
  reorderCustomAnnexesAction,
} from '../custom-annex-actions';
import { CustomAnnex } from '@/domain/entities/CustomAnnex';

vi.mock('../utils', () => ({
  getAuthenticatedUserId: vi.fn(),
  getCustomAnnexRepo: vi.fn(),
  getRepository: vi.fn(),
  getIdGenerator: vi.fn(),
  withErrorHandling: vi.fn(async (fn: () => Promise<unknown>) => {
    try {
      return { success: true, data: await fn() };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }),
}));

import { getAuthenticatedUserId, getCustomAnnexRepo, getRepository, getIdGenerator } from '../utils';

const DOC = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bonjour' }] }],
});

describe('custom annex actions', () => {
  const repo = {
    findByProjectId: vi.fn(),
    findById: vi.fn(),
    countByProjectAndPlacement: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const projectRepo = { loadProject: vi.fn() };
  const idGen = { generate: vi.fn(() => 'new-id') };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(getCustomAnnexRepo).mockResolvedValue(repo as never);
    vi.mocked(getRepository).mockResolvedValue(projectRepo as never);
    vi.mocked(getIdGenerator).mockResolvedValue(idGen as never);
  });

  it('lists serialized annexes with hasContent', async () => {
    repo.findByProjectId.mockResolvedValue([
      new CustomAnnex('a', 'proj-1', 'Titre', DOC, 'back', 0),
    ]);

    const result = await listCustomAnnexesAction('proj-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].hasContent).toBe(true);
      expect(result.data[0].placement).toBe('back');
    }
  });

  it('creates an annex appended at the end of its placement zone', async () => {
    projectRepo.loadProject.mockResolvedValue({ getId: () => 'proj-1' });
    repo.countByProjectAndPlacement.mockResolvedValue(2);

    const result = await createCustomAnnexAction('proj-1', 'Présentation', 'back');

    expect(result.success).toBe(true);
    expect(repo.create).toHaveBeenCalled();
    if (result.success) {
      expect(result.data.order).toBe(2);
      expect(result.data.placement).toBe('back');
      expect(result.data.title).toBe('Présentation');
    }
  });

  it('rejects an invalid placement on create', async () => {
    const result = await createCustomAnnexAction('proj-1', 'X', 'middle');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Emplacement invalide');
  });

  it('rejects creation when the project is not found', async () => {
    projectRepo.loadProject.mockResolvedValue(null);
    repo.countByProjectAndPlacement.mockResolvedValue(0);

    const result = await createCustomAnnexAction('proj-1', 'X', 'front');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Projet non trouvé');
  });

  it('updates content of an owned annex', async () => {
    const annex = new CustomAnnex('a', 'proj-1', 'Titre', DOC, 'back', 0);
    repo.findById.mockResolvedValue(annex);

    const newContent = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nouveau' }] }] });
    const result = await updateCustomAnnexAction('proj-1', 'a', { content: newContent });

    expect(result.success).toBe(true);
    expect(repo.update).toHaveBeenCalled();
    if (result.success) expect(result.data.content).toContain('Nouveau');
  });

  it('refuses to update an annex belonging to another project', async () => {
    repo.findById.mockResolvedValue(new CustomAnnex('a', 'other-proj', 'T', DOC, 'back', 0));

    const result = await updateCustomAnnexAction('proj-1', 'a', { title: 'X' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Annexe non trouvée');
  });

  it('deletes an owned annex', async () => {
    repo.findById.mockResolvedValue(new CustomAnnex('a', 'proj-1', 'T', DOC, 'back', 0));

    const result = await deleteCustomAnnexAction('proj-1', 'a');
    expect(result.success).toBe(true);
    expect(repo.delete).toHaveBeenCalledWith('user-1', 'a');
  });

  it('reorders annexes within a placement, only updating those whose order changed', async () => {
    const a = new CustomAnnex('a', 'proj-1', 'A', DOC, 'back', 0);
    const b = new CustomAnnex('b', 'proj-1', 'B', DOC, 'back', 1);
    repo.findByProjectId.mockResolvedValue([a, b]);

    const result = await reorderCustomAnnexesAction('proj-1', 'back', ['b', 'a']);

    expect(result.success).toBe(true);
    // Both move (b: 1->0, a: 0->1)
    expect(repo.update).toHaveBeenCalledTimes(2);
    expect(b.getOrder()).toBe(0);
    expect(a.getOrder()).toBe(1);
  });
});
