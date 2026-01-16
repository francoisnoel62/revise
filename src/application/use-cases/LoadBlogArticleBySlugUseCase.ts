// ABOUTME: Use case for loading a published blog article by slug
// ABOUTME: Public access - no authentication required

import { BlogArticle } from '../../domain/entities/BlogArticle';
import { BlogArticleRepository } from '../../domain/interfaces/BlogArticleRepository';

export interface LoadBlogArticleBySlugInput {
  slug: string;
}

export interface LoadBlogArticleBySlugResult {
  article: BlogArticle;
}

export class LoadBlogArticleBySlugUseCase {
  constructor(private readonly blogArticleRepository: BlogArticleRepository) {}

  async execute(input: LoadBlogArticleBySlugInput): Promise<LoadBlogArticleBySlugResult> {
    // Validate input
    if (!input.slug || input.slug.trim().length === 0) {
      throw new Error('Article slug is required');
    }

    // Load published article from repository
    const article = await this.blogArticleRepository.findBySlug(input.slug.toLowerCase());

    if (!article) {
      throw new Error('Article not found');
    }

    return { article };
  }
}
