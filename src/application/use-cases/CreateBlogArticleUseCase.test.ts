// ABOUTME: Tests blog article creation with infrastructure-free dependencies.
// ABOUTME: Ensures the use case receives the identifier from its caller.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateBlogArticleUseCase } from './CreateBlogArticleUseCase';
import type { BlogArticleRepository } from '@/domain/interfaces/BlogArticleRepository';

describe('CreateBlogArticleUseCase', () => {
  let repository: BlogArticleRepository;
  let generateId: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    repository = {
      findBySlug: vi.fn(),
      findAllPublished: vi.fn(),
      findAllPublishedPaginated: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      slugExists: vi.fn().mockResolvedValue(false),
      incrementViewCount: vi.fn(),
    };
    generateId = vi.fn().mockReturnValue('article-42');
  });

  it('persists an article using the caller-provided ID generator', async () => {
    const useCase = new CreateBlogArticleUseCase(repository, { generate: generateId });

    const { article } = await useCase.execute({
      authorId: 'author-1',
      slug: 'clean-architecture',
      title: 'Clean Architecture',
      excerpt: 'Un aperçu.',
      content: 'Le contenu de l’article.',
    });

    expect(article.getId()).toBe('article-42');
    expect(generateId).toHaveBeenCalledOnce();
    expect(repository.create).toHaveBeenCalledWith(article);
  });
});
