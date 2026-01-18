// ABOUTME: Generic interface for paginated query results
// ABOUTME: Used by repositories to return paginated data with metadata

/**
 * Generic paginated result interface.
 * Framework-agnostic, used across all layers.
 */
export interface PaginatedResult<T> {
  /** Items for the current page */
  items: T[];
  /** Total number of items across all pages */
  totalCount: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
}

/**
 * Helper to create a PaginatedResult from items and total count.
 */
export function createPaginatedResult<T>(
  items: T[],
  totalCount: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(totalCount / pageSize);
  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
