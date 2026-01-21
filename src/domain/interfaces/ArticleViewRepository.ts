// ABOUTME: Repository interface for ArticleView persistence
// ABOUTME: Tracks visitor fingerprints to prevent duplicate view counting

import { ArticleView } from '../entities/ArticleView';

export interface ArticleViewRepository {
  /**
   * Check if a visitor has already viewed an article within the TTL period.
   * @param articleId - The article ID
   * @param visitorHash - Hash of IP + User-Agent
   * @returns true if visitor already viewed this article recently
   */
  hasRecentView(articleId: string, visitorHash: string): Promise<boolean>;

  /**
   * Record a new article view.
   * @param view - The ArticleView entity to save
   */
  create(view: ArticleView): Promise<void>;

  /**
   * Delete old view records (older than TTL).
   * Used for cleanup - views older than 24h can be deleted.
   * @param olderThan - Delete records older than this date
   * @returns Number of deleted records
   */
  deleteOlderThan(olderThan: Date): Promise<number>;
}
