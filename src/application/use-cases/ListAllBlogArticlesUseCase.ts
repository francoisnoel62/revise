// ABOUTME: Use case for listing all blog articles (including drafts)
// ABOUTME: Admin-only - caller must verify admin status before calling

import { BlogArticle } from '../../domain/entities/BlogArticle';
import { BlogArticleRepository } from '../../domain/interfaces/BlogArticleRepository';

export interface ListAllBlogArticlesResult {
  articles: BlogArticle[];
}

export class ListAllBlogArticlesUseCase {
  constructor(private readonly blogArticleRepository: BlogArticleRepository) {}

  async execute(): Promise<ListAllBlogArticlesResult> {
    const articles = await this.blogArticleRepository.findAll();
    return { articles };
  }
}
