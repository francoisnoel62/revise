// ABOUTME: Use case for creating a new blog article
// ABOUTME: Admin-only - caller must verify admin status before calling

import { randomUUID } from 'node:crypto';
import { BlogArticle } from '../../domain/entities/BlogArticle';
import { BlogArticleRepository } from '../../domain/interfaces/BlogArticleRepository';

export interface CreateBlogArticleInput {
  authorId: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  readingTime?: number;
  isPublished?: boolean;
}

export interface CreateBlogArticleResult {
  article: BlogArticle;
}

export class CreateBlogArticleUseCase {
  constructor(private readonly blogArticleRepository: BlogArticleRepository) {}

  async execute(input: CreateBlogArticleInput): Promise<CreateBlogArticleResult> {
    // Validate required fields
    if (!input.authorId || input.authorId.trim().length === 0) {
      throw new Error('Author ID is required');
    }

    if (!input.slug || input.slug.trim().length === 0) {
      throw new Error('Article slug is required');
    }

    if (!input.title || input.title.trim().length === 0) {
      throw new Error('Article title is required');
    }

    if (!input.excerpt || input.excerpt.trim().length === 0) {
      throw new Error('Article excerpt is required');
    }

    if (!input.content || input.content.trim().length === 0) {
      throw new Error('Article content is required');
    }

    // Check if slug already exists
    const slugExists = await this.blogArticleRepository.slugExists(input.slug);
    if (slugExists) {
      throw new Error(`Article with slug "${input.slug}" already exists`);
    }

    // Create the article entity
    const article = BlogArticle.create({
      id: randomUUID(),
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      authorId: input.authorId,
      readingTime: input.readingTime,
      isPublished: input.isPublished ?? false,
    });

    // Publish if requested
    if (input.isPublished) {
      article.publish();
    }

    // Save to repository
    await this.blogArticleRepository.create(article);

    return { article };
  }
}
