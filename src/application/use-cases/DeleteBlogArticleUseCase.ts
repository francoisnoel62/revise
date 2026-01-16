// ABOUTME: Use case for deleting a blog article
// ABOUTME: Admin-only - caller must verify admin status before calling

import { BlogArticleRepository } from '../../domain/interfaces/BlogArticleRepository';

export interface DeleteBlogArticleInput {
  articleId: string;
}

export interface DeleteBlogArticleResult {
  deleted: true;
}

export class DeleteBlogArticleUseCase {
  constructor(private readonly blogArticleRepository: BlogArticleRepository) {}

  async execute(input: DeleteBlogArticleInput): Promise<DeleteBlogArticleResult> {
    // Validate article ID
    if (!input.articleId || input.articleId.trim().length === 0) {
      throw new Error('Article ID is required');
    }

    // Verify article exists
    const article = await this.blogArticleRepository.findById(input.articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    // Delete the article
    await this.blogArticleRepository.delete(input.articleId);

    return { deleted: true };
  }
}
