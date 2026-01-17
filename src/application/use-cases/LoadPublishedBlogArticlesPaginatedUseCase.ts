// ABOUTME: Use case for loading published blog articles with pagination
// ABOUTME: Public access - no authentication required

import { BlogArticle } from '../../domain/entities/BlogArticle';
import { BlogArticleRepository } from '../../domain/interfaces/BlogArticleRepository';
import { PaginatedResult } from '../../domain/interfaces/PaginatedResult';

export interface LoadPublishedBlogArticlesPaginatedInput {
  page: number;
  pageSize: number;
}

export interface LoadPublishedBlogArticlesPaginatedResult {
  articles: PaginatedResult<BlogArticle>;
}

export class LoadPublishedBlogArticlesPaginatedUseCase {
  constructor(private readonly blogArticleRepository: BlogArticleRepository) {}

  async execute(
    input: LoadPublishedBlogArticlesPaginatedInput
  ): Promise<LoadPublishedBlogArticlesPaginatedResult> {
    const page = Math.max(1, input.page);
    const pageSize = Math.max(1, Math.min(100, input.pageSize));

    const articles = await this.blogArticleRepository.findAllPublishedPaginated(
      page,
      pageSize
    );

    return { articles };
  }
}
