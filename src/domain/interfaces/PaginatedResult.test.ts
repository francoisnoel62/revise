// ABOUTME: Test suite for PaginatedResult helper function
// ABOUTME: Validates pagination metadata calculation

import { describe, it, expect } from 'vitest';
import { createPaginatedResult } from './PaginatedResult';

describe('createPaginatedResult', () => {
  it('should calculate pagination metadata correctly for first page', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const result = createPaginatedResult(items, 23, 1, 5);

    expect(result.items).toEqual(items);
    expect(result.totalCount).toBe(23);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(5);
    expect(result.totalPages).toBe(5);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPreviousPage).toBe(false);
  });

  it('should calculate pagination metadata correctly for middle page', () => {
    const items = ['f', 'g', 'h', 'i', 'j'];
    const result = createPaginatedResult(items, 23, 3, 5);

    expect(result.items).toEqual(items);
    expect(result.page).toBe(3);
    expect(result.totalPages).toBe(5);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPreviousPage).toBe(true);
  });

  it('should calculate pagination metadata correctly for last page', () => {
    const items = ['u', 'v', 'w'];
    const result = createPaginatedResult(items, 23, 5, 5);

    expect(result.items).toEqual(items);
    expect(result.page).toBe(5);
    expect(result.totalPages).toBe(5);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(true);
  });

  it('should handle single page of results', () => {
    const items = ['a', 'b'];
    const result = createPaginatedResult(items, 2, 1, 5);

    expect(result.totalPages).toBe(1);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(false);
  });

  it('should handle empty results', () => {
    const result = createPaginatedResult([], 0, 1, 5);

    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(false);
  });

  it('should handle exact page boundary', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const result = createPaginatedResult(items, 10, 1, 5);

    expect(result.totalPages).toBe(2);
    expect(result.hasNextPage).toBe(true);
  });

  it('should handle total count of 1', () => {
    const items = ['a'];
    const result = createPaginatedResult(items, 1, 1, 5);

    expect(result.totalPages).toBe(1);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPreviousPage).toBe(false);
  });
});
