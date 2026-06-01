// ABOUTME: Repository interface for WordCountSnapshot persistence
// ABOUTME: Defines contract for recording and querying daily word count history

import { WordCountSnapshot } from '../entities/WordCountSnapshot';

export interface WordCountSnapshotRepository {
  /**
   * Record the total word count for an author-local day.
   * Idempotent per (owner, project, localDate): an existing day is updated in place.
   */
  upsertForDay(userId: string, snapshot: WordCountSnapshot): Promise<WordCountSnapshot>;

  /**
   * Return snapshots for a project ordered by localDate ascending.
   * When provided, fromDate/toDate bound the range inclusively (YYYY-MM-DD).
   */
  findByProjectId(
    userId: string,
    projectId: string,
    range?: { fromDate?: string; toDate?: string }
  ): Promise<WordCountSnapshot[]>;

  /**
   * Return the most recent snapshot strictly before the given localDate, if any.
   */
  findLatestBefore(
    userId: string,
    projectId: string,
    localDate: string
  ): Promise<WordCountSnapshot | null>;

  deleteAllByOwner(userId: string): Promise<void>;
}
