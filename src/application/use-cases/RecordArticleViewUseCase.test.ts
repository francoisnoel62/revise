// ABOUTME: Unit tests for RecordArticleViewUseCase
// ABOUTME: Tests view recording with duplicate prevention logic

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordArticleViewUseCase } from './RecordArticleViewUseCase';
import { ArticleViewRepository } from '../../domain/interfaces/ArticleViewRepository';
import { BlogArticleRepository } from '../../domain/interfaces/BlogArticleRepository';

describe('RecordArticleViewUseCase', () => {
  let mockArticleViewRepo: ArticleViewRepository;
  let mockBlogArticleRepo: BlogArticleRepository;
  let mockHashFunction: (text: string) => string;
  let useCase: RecordArticleViewUseCase;

  beforeEach(() => {
    mockArticleViewRepo = {
      hasRecentView: vi.fn().mockResolvedValue(false),
      create: vi.fn().mockResolvedValue(undefined),
      deleteOlderThan: vi.fn().mockResolvedValue(0),
    };

    mockBlogArticleRepo = {
      findBySlug: vi.fn(),
      findAllPublished: vi.fn(),
      findAllPublishedPaginated: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      slugExists: vi.fn(),
      incrementViewCount: vi.fn().mockResolvedValue(42),
    };

    mockHashFunction = vi.fn().mockImplementation((text: string) => `hash_${text}`);

    useCase = new RecordArticleViewUseCase(
      mockArticleViewRepo,
      mockBlogArticleRepo,
      mockHashFunction
    );
  });

  describe('execute', () => {
    const validInput = {
      articleId: 'article-123',
      visitorIp: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test Browser',
    };

    it('records a new view when visitor has not viewed recently', async () => {
      const result = await useCase.execute(validInput);

      expect(result.recorded).toBe(true);
      expect(result.newViewCount).toBe(42);
      expect(mockHashFunction).toHaveBeenCalledWith(
        `${validInput.articleId}:${validInput.visitorIp}:${validInput.userAgent}`
      );
      expect(mockArticleViewRepo.create).toHaveBeenCalled();
      expect(mockBlogArticleRepo.incrementViewCount).toHaveBeenCalledWith(validInput.articleId);
    });

    it('does not record view when visitor has recently viewed', async () => {
      vi.mocked(mockArticleViewRepo.hasRecentView).mockResolvedValue(true);

      const result = await useCase.execute(validInput);

      expect(result.recorded).toBe(false);
      expect(result.newViewCount).toBeNull();
      expect(mockArticleViewRepo.create).not.toHaveBeenCalled();
      expect(mockBlogArticleRepo.incrementViewCount).not.toHaveBeenCalled();
    });

    it('throws error for empty article ID', async () => {
      await expect(
        useCase.execute({ ...validInput, articleId: '' })
      ).rejects.toThrow('Article ID is required');
    });

    it('throws error for whitespace-only article ID', async () => {
      await expect(
        useCase.execute({ ...validInput, articleId: '   ' })
      ).rejects.toThrow('Article ID is required');
    });

    it('throws error for empty visitor IP', async () => {
      await expect(
        useCase.execute({ ...validInput, visitorIp: '' })
      ).rejects.toThrow('Visitor IP is required');
    });

    it('uses unknown for missing user agent', async () => {
      await useCase.execute({ ...validInput, userAgent: '' });

      expect(mockHashFunction).toHaveBeenCalledWith(
        `${validInput.articleId}:${validInput.visitorIp}:unknown`
      );
    });

    it('generates unique hash for different articles', async () => {
      await useCase.execute(validInput);
      await useCase.execute({ ...validInput, articleId: 'article-456' });

      const calls = vi.mocked(mockHashFunction).mock.calls;
      expect(calls[0][0]).toContain('article-123');
      expect(calls[1][0]).toContain('article-456');
    });

    it('generates unique hash for different IPs', async () => {
      await useCase.execute(validInput);
      await useCase.execute({ ...validInput, visitorIp: '10.0.0.1' });

      const calls = vi.mocked(mockHashFunction).mock.calls;
      expect(calls[0][0]).toContain('192.168.1.1');
      expect(calls[1][0]).toContain('10.0.0.1');
    });
  });
});
