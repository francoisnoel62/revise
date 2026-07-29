// ABOUTME: Tests for collaborative snapshot governance rules.
// ABOUTME: Covers role-based metadata edits and irreversible owner-only deletion tombstones.

import { describe, expect, it, vi } from 'vitest';
import { Snapshot } from '@/domain/entities/Snapshot';
import { GovernSnapshotHistoryUseCase } from '../GovernSnapshotHistoryUseCase';
import type { SnapshotRepository } from '@/domain/interfaces/SnapshotRepository';

const ownerId = 'owner-1';
const projectId = 'project-1';

function snapshot(overrides: Partial<ConstructorParameters<typeof Snapshot>[0]> = {}) {
  return new Snapshot({
    id: 'snapshot-1', projectId, ownerId, authorId: 'editor-1', number: 4,
    type: 'manual', title: 'Avant révision', comment: 'Premier jet', projectTitle: 'Roman',
    chapters: [{ id: 'chapter-1', title: 'Chapitre 1', content: '{"type":"doc"}', order: 0 }],
    editorialMetadata: null,
    ...overrides,
  });
}

function repository(current: Snapshot): SnapshotRepository {
  return {
    getNextSequenceNumber: vi.fn(), save: vi.fn(), findByProjectId: vi.fn(),
    findLatestByProjectId: vi.fn(), findById: vi.fn().mockResolvedValue(current),
    deleteByProjectId: vi.fn(), deleteAllByOwner: vi.fn(),
    updateMetadata: vi.fn(), tombstone: vi.fn(),
  };
}

describe('GovernSnapshotHistoryUseCase', () => {
  it('allows the snapshot author to rename and comment without changing its captured content', async () => {
    const original = snapshot();
    const snapshots = repository(original);
    const useCase = new GovernSnapshotHistoryUseCase(snapshots);

    const edited = await useCase.updateMetadata({ ownerId, projectId, snapshotId: original.getId(), requesterId: 'editor-1', requesterRole: 'editor', title: 'Après révision', comment: 'À relire' });

    expect(edited.getTitle()).toBe('Après révision');
    expect(edited.getComment()).toBe('À relire');
    expect(edited.getChapters()).toEqual(original.getChapters());
    expect(snapshots.updateMetadata).toHaveBeenCalledWith(ownerId, edited);
  });

  it('refuses a reader edit and any edit of a deleted audit entry', async () => {
    const snapshots = repository(snapshot());
    const useCase = new GovernSnapshotHistoryUseCase(snapshots);

    await expect(useCase.updateMetadata({ ownerId, projectId, snapshotId: 'snapshot-1', requesterId: 'reader-1', requesterRole: 'reader', title: 'Non' })).rejects.toThrow('Seul l’auteur du snapshot ou le propriétaire');

    vi.mocked(snapshots.findById).mockResolvedValue(snapshot({ deletedAt: new Date(), deletedById: ownerId }));
    await expect(useCase.updateMetadata({ ownerId, projectId, snapshotId: 'snapshot-1', requesterId: ownerId, requesterRole: 'owner', title: 'Non' })).rejects.toThrow('supprimé');
  });

  it('only lets the owner permanently tombstone a snapshot while preserving its number and restoration provenance', async () => {
    const snapshots = repository(snapshot());
    const useCase = new GovernSnapshotHistoryUseCase(snapshots);

    await expect(useCase.delete({ ownerId, projectId, snapshotId: 'snapshot-1', requesterId: 'editor-1', requesterRole: 'editor' })).rejects.toThrow('propriétaire');

    const deleted = await useCase.delete({ ownerId, projectId, snapshotId: 'snapshot-1', requesterId: ownerId, requesterRole: 'owner', now: new Date('2026-07-29T12:00:00Z') });
    expect(deleted.getNumber()).toBe(4);
    expect(deleted.isDeleted()).toBe(true);
    expect(deleted.getChapters()).toEqual([]);
    expect(deleted.getDeletedById()).toBe(ownerId);
    expect(snapshots.tombstone).toHaveBeenCalledWith(ownerId, deleted);
  });
});
