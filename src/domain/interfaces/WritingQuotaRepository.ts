// ABOUTME: Repository interface for WritingQuota persistence
// ABOUTME: Defines contract for storing and retrieving recurring writing quotas

import { WritingQuota } from '../entities/WritingQuota';

export interface WritingQuotaRepository {
  create(userId: string, quota: WritingQuota): Promise<WritingQuota>;
  findById(userId: string, quotaId: string): Promise<WritingQuota | null>;
  findByProjectId(userId: string, projectId: string): Promise<WritingQuota[]>;
  update(userId: string, quota: WritingQuota): Promise<WritingQuota>;
  delete(userId: string, quotaId: string): Promise<void>;
  deleteAllByOwner(userId: string): Promise<void>;
}
