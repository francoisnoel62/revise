// ABOUTME: Repository interface for Snapshot persistence
// ABOUTME: Defines CRUD and sequential numbering with multi-tenant isolation via ownerId

import { Snapshot } from '../entities/Snapshot';

export interface SnapshotRepository {
  /**
   * Atomically allocate the next sequential snapshot number for a project.
   * Numbers are never reused, even if the snapshot that consumed one is never saved.
   * @param ownerId - User ID for multi-tenant isolation
   * @param projectId - The project ID
   * @returns The next sequence number (starts at 1)
   */
  getNextSequenceNumber(ownerId: string, projectId: string): Promise<number>;

  /**
   * Save a new snapshot. Snapshots are immutable once saved.
   * @param ownerId - User ID for multi-tenant isolation
   * @param snapshot - The snapshot entity to save
   */
  save(ownerId: string, snapshot: Snapshot): Promise<void>;

  /**
   * Find all snapshots for a project, sorted by number descending (newest first).
   * @param ownerId - User ID for multi-tenant isolation
   * @param projectId - The project ID
   */
  findByProjectId(ownerId: string, projectId: string): Promise<Snapshot[]>;

  /**
   * Find the most recent snapshot for a project, if any.
   * @param ownerId - User ID for multi-tenant isolation
   * @param projectId - The project ID
   */
  findLatestByProjectId(ownerId: string, projectId: string): Promise<Snapshot | null>;

  /**
   * Find a snapshot by ID.
   * @param ownerId - User ID for multi-tenant isolation
   * @param snapshotId - The snapshot ID
   */
  findById(ownerId: string, snapshotId: string): Promise<Snapshot | null>;

  /**
   * Delete all snapshots for a project.
   * Used when deleting a project.
   * @param ownerId - User ID for multi-tenant isolation
   * @param projectId - The project ID
   */
  deleteByProjectId(ownerId: string, projectId: string): Promise<void>;

  /**
   * Delete all snapshots owned by a user.
   * Used for RGPD account deletion.
   * @param ownerId - User ID whose snapshots to delete
   * @returns Number of snapshots deleted
   */
  deleteAllByOwner(ownerId: string): Promise<number>;
}
