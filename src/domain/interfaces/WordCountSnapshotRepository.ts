// ABOUTME: Repository interface for WordCountSnapshot persistence
// ABOUTME: Defines contract for storing and retrieving daily word count snapshots

import { WordCountSnapshot } from '../entities/WordCountSnapshot';

export interface WordCountSnapshotRepository {
  /**
   * Creates or updates the snapshot for a given project and date.
   * If a snapshot already exists for that date, it updates the word count.
   */
  upsert(userId: string, snapshot: WordCountSnapshot): Promise<WordCountSnapshot>;

  /**
   * Finds a snapshot for a specific date (normalized to Paris midnight).
   */
  findByDate(
    userId: string,
    projectId: string,
    date: Date
  ): Promise<WordCountSnapshot | null>;

  /**
   * Finds the most recent snapshot before the given date.
   * Used to calculate period-based progress (daily/weekly).
   */
  findLatestBefore(
    userId: string,
    projectId: string,
    beforeDate: Date
  ): Promise<WordCountSnapshot | null>;

  /**
   * Finds all snapshots within a date range (inclusive).
   * Used for generating progress charts and statistics.
   */
  findByDateRange(
    userId: string,
    projectId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WordCountSnapshot[]>;

  /**
   * Deletes all snapshots for a given owner (GDPR compliance).
   */
  deleteAllByOwner(userId: string): Promise<void>;

  /**
   * Deletes all snapshots for a given project.
   */
  deleteAllByProject(userId: string, projectId: string): Promise<void>;
}
