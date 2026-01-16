// ABOUTME: Use case for loading all published blog articles
// ABOUTME: Public access - no authentication required

import { BlogArticle } from '../../domain/entities/BlogArticle';
import { BlogArticleRepository } from '../../domain/interfaces/BlogArticleRepository';

export interface LoadPublishedBlogArticlesResult {
  articles: BlogArticle[];
}

export class LoadPublishedBlogArticlesUseCase {
  constructor(private readonly blogArticleRepository: BlogArticleRepository) {}

  async execute(): Promise<LoadPublishedBlogArticlesResult> {
    const articles = await this.blogArticleRepository.findAllPublished();
    return { articles };
  }
}
