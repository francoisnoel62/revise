// ABOUTME: Governs mutable snapshot metadata and irreversible audit tombstones.
// ABOUTME: Authorization is explicit so a future collaboration adapter can resolve roles at its boundary.

import type { SnapshotRepository } from '@/domain/interfaces/SnapshotRepository';
import type { Snapshot } from '@/domain/entities/Snapshot';

export type SnapshotCollaborationRole = 'owner' | 'editor' | 'reader';

interface GovernanceInput {
  ownerId: string;
  projectId: string;
  snapshotId: string;
  requesterId: string;
  requesterRole: SnapshotCollaborationRole;
}

export class GovernSnapshotHistoryUseCase {
  constructor(private readonly snapshots: SnapshotRepository) {}

  async updateMetadata(input: GovernanceInput & { title: string; comment?: string | null }): Promise<Snapshot> {
    const snapshot = await this.find(input);
    if (snapshot.getAuthorId() !== input.requesterId && input.requesterRole !== 'owner') {
      throw new Error('Seul l’auteur du snapshot ou le propriétaire peut modifier ses métadonnées');
    }
    if (!this.snapshots.updateMetadata) throw new Error('La modification des snapshots n’est pas disponible');
    const edited = snapshot.withMetadata(input.title, input.comment);
    await this.snapshots.updateMetadata(input.ownerId, edited);
    await this.snapshots.recordActivity?.({
      ownerId: input.ownerId, projectId: input.projectId, actorId: input.requesterId,
      type: input.comment !== snapshot.getComment() ? 'commented' : 'renamed',
      snapshotNumber: snapshot.getNumber(), createdAt: new Date(),
    });
    return edited;
  }

  async delete(input: GovernanceInput & { now?: Date }): Promise<Snapshot> {
    if (input.requesterRole !== 'owner') throw new Error('Seul le propriétaire peut supprimer un snapshot');
    if (!this.snapshots.tombstone) throw new Error('La suppression des snapshots n’est pas disponible');
    const deleted = (await this.find(input)).tombstone(input.requesterId, input.now);
    await this.snapshots.tombstone(input.ownerId, deleted);
    await this.snapshots.recordActivity?.({
      ownerId: input.ownerId, projectId: input.projectId, actorId: input.requesterId,
      type: 'deleted', snapshotNumber: deleted.getNumber(), createdAt: deleted.getDeletedAt()!,
    });
    return deleted;
  }

  private async find(input: GovernanceInput): Promise<Snapshot> {
    const snapshot = await this.snapshots.findById(input.ownerId, input.snapshotId);
    if (!snapshot || snapshot.getProjectId() !== input.projectId) throw new Error('Snapshot introuvable');
    return snapshot;
  }
}
