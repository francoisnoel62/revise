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
   * Replace all derived facts of a project with the given set, preserving author facts.
   */
  replaceDerived(ownerId: string, projectId: string, facts: CanonFact[]): Promise<void>;

  deleteAllByOwner(ownerId: string): Promise<void>;
}
