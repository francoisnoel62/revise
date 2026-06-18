// ABOUTME: Repository interface for CanonFact persistence (the canon ledger)
// ABOUTME: Supports temporal selection and derived/author reconciliation (replaceDerived)

import { CanonFact } from '../entities/CanonFact';

export interface CanonFactRepository {
  save(fact: CanonFact): Promise<CanonFact>;

  update(ownerId: string, fact: CanonFact): Promise<void>;

  delete(ownerId: string, factId: string): Promise<void>;

  listByProject(ownerId: string, projectId: string): Promise<CanonFact[]>;

  /**
   * Select facts about the given entities that are valid at the given chapter index:
   * validFromChapter <= chapterIndex AND (validToChapter is null OR validToChapter >= chapterIndex).
   */
  findForSelection(
    ownerId: string,
    projectId: string,
    entities: string[],
    chapterIndex: number
  ): Promise<CanonFact[]>;

  /**
   * Replace derived facts for a project. When reprocessedChapterIds is provided, only
   * facts whose sourceChapterId is in that set are deleted — facts from other chapters
   * are preserved. When omitted, all derived facts are replaced (original behaviour).
   */
  replaceDerived(
    ownerId: string,
    projectId: string,
    facts: CanonFact[],
    reprocessedChapterIds?: string[]
  ): Promise<void>;

  deleteAllByOwner(ownerId: string): Promise<void>;

  /** Return the per-chapter content hashes stored from the last extraction run. */
  getChapterHashes(ownerId: string, projectId: string): Promise<Map<string, string>>;

  /** Persist per-chapter content hashes after an extraction run. */
  saveChapterHashes(ownerId: string, projectId: string, hashes: Map<string, string>): Promise<void>;
}
