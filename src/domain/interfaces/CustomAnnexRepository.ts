// ABOUTME: Repository interface for CustomAnnex persistence.
// ABOUTME: CRUD + ordering with multi-tenant isolation via ownerId.

import { CustomAnnex, type AnnexPlacement } from '../entities/CustomAnnex';

export interface CustomAnnexRepository {
  /** All annexes for a project, sorted by placement then order. */
  findByProjectId(ownerId: string, projectId: string): Promise<CustomAnnex[]>;

  /** A single annex by id, or null. */
  findById(ownerId: string, id: string): Promise<CustomAnnex | null>;

  /** Number of annexes in a given placement zone (used to append at the end). */
  countByProjectAndPlacement(
    ownerId: string,
    projectId: string,
    placement: AnnexPlacement,
  ): Promise<number>;

  create(ownerId: string, annex: CustomAnnex): Promise<CustomAnnex>;

  update(ownerId: string, annex: CustomAnnex): Promise<CustomAnnex>;

  delete(ownerId: string, id: string): Promise<void>;

  /** Delete every annex of a project (project deletion). */
  deleteByProjectId(ownerId: string, projectId: string): Promise<void>;

  /** Delete every annex owned by a user (RGPD account deletion). Returns the count. */
  deleteAllByOwner(ownerId: string): Promise<number>;
}
