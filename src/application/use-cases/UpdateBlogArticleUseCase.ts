// ABOUTME: Use case for updating an existing blog article
// ABOUTME: Admin-only - caller must verify admin status before calling

import { BlogArticle } from '../../domain/entities/BlogArticle';
import { BlogArticleRepository } from '../../domain/interfaces/BlogArticleRepository';

export interface UpdateBlogArticleInput {
  articleId: string;
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  readingTime?: number;
  isPublished?: boolean;
}

export interface UpdateBlogArticleResult {
  article: BlogArticle;
}

export class UpdateBlogArticleUseCase {
  constructor(private readonly blogArticleRepository: BlogArticleRepository) {}

  async execute(input: UpdateBlogArticleInput): Promise<UpdateBlogArticleResult> {
    // Validate article ID
    if (!input.articleId || input.articleId.trim().length === 0) {
      throw new Error('Article ID is required');
    }

    // Load existing article
    const article = await this.blogArticleRepository.findById(input.articleId);
    if (!article) {
      throw new Error('Article not found');
    }

    // Check if new slug conflicts with existing article
    if (input.slug && input.slug !== article.getSlug()) {
      const slugExists = await this.blogArticleRepository.slugExists(
        input.slug,
        input.articleId
      );
      if (slugExists) {
        throw new Error(`Article with slug "${input.slug}" already exists`);
      }
      article.updateSlug(input.slug);
    }

    // Apply updates
    if (input.title !== undefined) {
      article.updateTitle(input.title);
    }

    if (input.excerpt !== undefined) {
      article.updateExcerpt(input.excerpt);
    }

    if (input.content !== undefined) {
      article.updateContent(input.content);
    }

    if (input.readingTime !== undefined) {
      article.updateReadingTime(input.readingTime);
    }

    // Handle publish/unpublish
    if (input.isPublished !== undefined) {
      if (input.isPublished) {
        article.publish();
      } else {
        article.unpublish();
      }
    }

    // Save updates
    await this.blogArticleRepository.update(article);

    return { article };
  }
}
