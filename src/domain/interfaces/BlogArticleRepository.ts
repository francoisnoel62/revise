// ABOUTME: Repository interface for BlogArticle persistence
// ABOUTME: Public reads (no auth), admin-only writes (verified in server actions)

import { BlogArticle } from '../entities/BlogArticle';
import { PaginatedResult } from './PaginatedResult';

export interface BlogArticleRepository {
  // ============================================
  // PUBLIC METHODS (no authentication required)
  // ============================================

  /**
   * Find a published article by its URL slug.
   * Returns null for unpublished articles (drafts).
   * @param slug - The URL-friendly article identifier
   * @returns The published article or null if not found/not published
   */
  findBySlug(slug: string): Promise<BlogArticle | null>;

  /**
   * Get all published articles, sorted by publishedAt descending.
   * @returns Array of published articles
   */
  findAllPublished(): Promise<BlogArticle[]>;

  /**
   * Get published articles with pagination, sorted by publishedAt descending.
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of items per page
   * @returns Paginated result with articles and metadata
   */
  findAllPublishedPaginated(
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<BlogArticle>>;

  // ============================================
  // ADMIN METHODS (caller must verify admin status)
  // ============================================

  /**
   * Create a new article.
   * @param article - The article entity to create
   * @returns The created article
   * @throws Error if slug already exists
   */
  create(article: BlogArticle): Promise<BlogArticle>;

  /**
   * Update an existing article.
   * @param article - The updated article entity
   * @returns The updated article
   * @throws Error if article not found
   */
  update(article: BlogArticle): Promise<BlogArticle>;

  /**
   * Delete an article by ID.
   * @param articleId - The article ID to delete
   * @throws Error if article not found
   */
  delete(articleId: string): Promise<void>;

  /**
   * Find an article by ID (includes drafts).
   * Used by admin for editing.
   * @param articleId - The article ID
   * @returns The article or null if not found
   */
  findById(articleId: string): Promise<BlogArticle | null>;

  /**
   * Get all articles including drafts, sorted by updatedAt descending.
   * Used by admin for article management.
   * @returns Array of all articles
   */
  findAll(): Promise<BlogArticle[]>;

  /**
   * Check if a slug is already in use.
   * @param slug - The slug to check
   * @param excludeArticleId - Optional article ID to exclude (for updates)
   * @returns true if slug exists
   */
  slugExists(slug: string, excludeArticleId?: string): Promise<boolean>;

  /**
   * Increment the view count for an article.
   * @param articleId - The article ID
   * @returns The new view count, or null if article not found
   */
  incrementViewCount(articleId: string): Promise<number | null>;
}
