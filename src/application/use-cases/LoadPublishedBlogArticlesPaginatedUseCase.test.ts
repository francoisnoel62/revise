// ABOUTME: Test suite for LoadPublishedBlogArticlesPaginatedUseCase
// ABOUTME: Validates paginated blog article loading with input validation

import { describe, it, expect, vi } from 'vitest';
import { LoadPublishedBlogArticlesPaginatedUseCase } from './LoadPublishedBlogArticlesPaginatedUseCase';
import { BlogArticleRepository } from '@/domain/interfaces/BlogArticleRepository';
import { BlogArticle } from '@/domain/entities/BlogArticle';
import { PaginatedResult } from '@/domain/interfaces/PaginatedResult';

describe('LoadPublishedBlogArticlesPaginatedUseCase', () => {
  const createMockArticle = (id: string, title: string): BlogArticle => {
    return new BlogArticle(
      id,
      `slug-${id}`,
      title,
      'Excerpt',
      'Content',
      5,
      true,
      new Date('2024-01-01'),
      'author-1',
      new Date('2024-01-01'),
      new Date('2024-01-01')
    );
  };

  const createMockRepository = (): BlogArticleRepository => ({
    findBySlug: vi.fn(),
    findAllPublished: vi.fn(),
    findAllPublishedPaginated: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    slugExists: vi.fn(),
  });

  const createPaginatedResponse = (
    articles: BlogArticle[],
    totalCount: number,
    page: number,
    pageSize: number
  ): PaginatedResult<BlogArticle> => {
    const totalPages = Math.ceil(totalCount / pageSize);
    return {
      items: articles,
      totalCount,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  };

  it('should return paginated articles from repository', async () => {
    const repo = createMockRepository();
    const articles = [
      createMockArticle('1', 'Article 1'),
      createMockArticle('2', 'Article 2'),
    ];
    const paginatedResult = createPaginatedResponse(articles, 7, 1, 5);

    repo.findAllPublishedPaginated = vi.fn().mockResolvedValue(paginatedResult);

    const useCase = new LoadPublishedBlogArticlesPaginatedUseCase(repo);
    const result = await useCase.execute({ page: 1, pageSize: 5 });

    expect(repo.findAllPublishedPaginated).toHaveBeenCalledWith(1, 5);
    expect(result.articles.items).toHaveLength(2);
    expect(result.articles.totalCount).toBe(7);
    expect(result.articles.page).toBe(1);
    expect(result.articles.pageSize).toBe(5);
  });

  it('should enforce minimum page of 1', async () => {
    const repo = createMockRepository();
    const paginatedResult = createPaginatedResponse([], 0, 1, 5);
    repo.findAllPublishedPaginated = vi.fn().mockResolvedValue(paginatedResult);

    const useCase = new LoadPublishedBlogArticlesPaginatedUseCase(repo);
    await useCase.execute({ page: 0, pageSize: 5 });

    expect(repo.findAllPublishedPaginated).toHaveBeenCalledWith(1, 5);
  });

  it('should enforce minimum page of 1 for negative values', async () => {
    const repo = createMockRepository();
    const paginatedResult = createPaginatedResponse([], 0, 1, 5);
    repo.findAllPublishedPaginated = vi.fn().mockResolvedValue(paginatedResult);

    const useCase = new LoadPublishedBlogArticlesPaginatedUseCase(repo);
    await useCase.execute({ page: -5, pageSize: 5 });

    expect(repo.findAllPublishedPaginated).toHaveBeenCalledWith(1, 5);
  });

  it('should enforce minimum pageSize of 1', async () => {
    const repo = createMockRepository();
    const paginatedResult = createPaginatedResponse([], 0, 1, 1);
    repo.findAllPublishedPaginated = vi.fn().mockResolvedValue(paginatedResult);

    const useCase = new LoadPublishedBlogArticlesPaginatedUseCase(repo);
    await useCase.execute({ page: 1, pageSize: 0 });

    expect(repo.findAllPublishedPaginated).toHaveBeenCalledWith(1, 1);
  });

  it('should enforce maximum pageSize of 100', async () => {
    const repo = createMockRepository();
    const paginatedResult = createPaginatedResponse([], 0, 1, 100);
    repo.findAllPublishedPaginated = vi.fn().mockResolvedValue(paginatedResult);

    const useCase = new LoadPublishedBlogArticlesPaginatedUseCase(repo);
    await useCase.execute({ page: 1, pageSize: 500 });

    expect(repo.findAllPublishedPaginated).toHaveBeenCalledWith(1, 100);
  });

  it('should handle empty results', async () => {
    const repo = createMockRepository();
    const paginatedResult = createPaginatedResponse([], 0, 1, 5);
    repo.findAllPublishedPaginated = vi.fn().mockResolvedValue(paginatedResult);

    const useCase = new LoadPublishedBlogArticlesPaginatedUseCase(repo);
    const result = await useCase.execute({ page: 1, pageSize: 5 });

    expect(result.articles.items).toHaveLength(0);
    expect(result.articles.totalCount).toBe(0);
    expect(result.articles.hasNextPage).toBe(false);
    expect(result.articles.hasPreviousPage).toBe(false);
  });

  it('should return correct pagination metadata for second page', async () => {
    const repo = createMockRepository();
    const articles = [
      createMockArticle('3', 'Article 3'),
      createMockArticle('4', 'Article 4'),
    ];
    const paginatedResult = createPaginatedResponse(articles, 12, 2, 5);
    repo.findAllPublishedPaginated = vi.fn().mockResolvedValue(paginatedResult);

    const useCase = new LoadPublishedBlogArticlesPaginatedUseCase(repo);
    const result = await useCase.execute({ page: 2, pageSize: 5 });

    expect(result.articles.page).toBe(2);
    expect(result.articles.hasNextPage).toBe(true);
    expect(result.articles.hasPreviousPage).toBe(true);
    expect(result.articles.totalPages).toBe(3);
  });

  it('should return correct pagination metadata for last page', async () => {
    const repo = createMockRepository();
    const articles = [createMockArticle('5', 'Article 5')];
    const paginatedResult = createPaginatedResponse(articles, 11, 3, 5);
    repo.findAllPublishedPaginated = vi.fn().mockResolvedValue(paginatedResult);

    const useCase = new LoadPublishedBlogArticlesPaginatedUseCase(repo);
    const result = await useCase.execute({ page: 3, pageSize: 5 });

    expect(result.articles.page).toBe(3);
    expect(result.articles.hasNextPage).toBe(false);
    expect(result.articles.hasPreviousPage).toBe(true);
    expect(result.articles.totalPages).toBe(3);
  });
});
