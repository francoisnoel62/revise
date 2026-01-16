// ABOUTME: Serialization utilities for BlogArticle <-> MongoDB document conversion.
// ABOUTME: Handles domain entity reconstruction from database documents.

import { BlogArticle, BlogArticleProperties } from '@/domain/entities/BlogArticle';

/**
 * MongoDB document shape for BlogArticle.
 */
export interface BlogArticleDocument {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown content
  readingTime: number;
  isPublished: boolean;
  publishedAt: Date | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert BlogArticle domain entity to MongoDB document.
 */
export function serializeBlogArticle(article: BlogArticle): BlogArticleDocument {
  return {
    _id: article.getId(),
    slug: article.getSlug(),
    title: article.getTitle(),
    excerpt: article.getExcerpt(),
    content: article.getContent(),
    readingTime: article.getReadingTime(),
    isPublished: article.isPublished(),
    publishedAt: article.getPublishedAt(),
    authorId: article.getAuthorId(),
    createdAt: article.getCreatedAt(),
    updatedAt: article.getUpdatedAt(),
  };
}

/**
 * Reconstruct BlogArticle domain entity from MongoDB document.
 */
export function deserializeBlogArticle(doc: BlogArticleDocument): BlogArticle {
  const properties: BlogArticleProperties = {
    readingTime: doc.readingTime,
    isPublished: doc.isPublished,
    publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
    authorId: doc.authorId,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };

  return new BlogArticle(
    doc._id,
    doc.slug,
    doc.title,
    doc.excerpt,
    doc.content,
    properties
  );
}
