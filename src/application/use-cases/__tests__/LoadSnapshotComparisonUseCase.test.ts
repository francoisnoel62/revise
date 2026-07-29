// ABOUTME: Unit tests for loading a read-only snapshot comparison.
// ABOUTME: Ensures audit tombstones are never exposed as previewable content.

import { describe, expect, it, vi } from 'vitest';
import { Snapshot } from '@/domain/entities/Snapshot';
import type { SnapshotRepository } from '@/domain/interfaces/SnapshotRepository';
import { LoadSnapshotComparisonUseCase } from '../LoadSnapshotComparisonUseCase';
import { SnapshotNotFoundError } from '../RestoreSnapshotUseCase';

describe('LoadSnapshotComparisonUseCase', () => {
  it('refuses a deleted snapshot so its erased content cannot be previewed', async () => {
    const deleted = new Snapshot({
      id: 'snapshot-1', projectId: 'project-1', ownerId: 'owner-1', authorId: 'author-1', number: 1,
      type: 'manual', title: 'Version supprimée', comment: null, projectTitle: 'Roman', chapters: [],
      editorialMetadata: null, deletedAt: new Date('2026-07-29T12:00:00Z'), deletedById: 'owner-1',
    });
    const snapshots = { findById: vi.fn().mockResolvedValue(deleted) } as unknown as SnapshotRepository;
    const useCase = new LoadSnapshotComparisonUseCase(snapshots, {} as never, {} as never);

    await expect(useCase.execute({ ownerId: 'owner-1', projectId: 'project-1', snapshotId: 'snapshot-1' }))
      .rejects.toThrow(SnapshotNotFoundError);
  });
});
