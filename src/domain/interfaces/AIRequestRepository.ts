// ABOUTME: Repository interface for AIRequestRecord persistence
// ABOUTME: Defines contract for storing and querying AI request visualization data

import { AIRequestRecord } from '../entities/AIRequestRecord';

export interface AIRequestRepository {
  /**
   * Persist a new AI request record.
   */
  save(record: AIRequestRecord): Promise<AIRequestRecord>;

  /**
   * Find a single request record by ID.
   * Always filters by userId for multi-tenant isolation.
   */
  findById(userId: string, recordId: string): Promise<AIRequestRecord | null>;

  /**
   * Find all request records for a project, newest first.
   * Always filters by userId for multi-tenant isolation.
   */
  findByProject(
    userId: string,
    projectId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<AIRequestRecord[]>;

  /**
   * Delete all request records for a project.
   * Used when a project is deleted.
   */
  deleteByProjectId(userId: string, projectId: string): Promise<void>;

  /**
   * Delete all request records for a user.
   * Used for GDPR compliance (account deletion).
   */
  deleteAllByOwner(userId: string): Promise<void>;
}
