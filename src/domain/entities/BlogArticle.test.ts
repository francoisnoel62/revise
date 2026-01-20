// ABOUTME: Unit tests for BlogArticle domain entity
// ABOUTME: Tests creation, mutations, and publication logic

import { describe, it, expect, beforeEach } from 'vitest';
import { BlogArticle } from './BlogArticle';

describe('BlogArticle', () => {
  const validParams = {
    id: 'article-1',
    slug: 'test-article',
    title: 'Test Article',
    excerpt: 'This is a test excerpt',
    content: 'This is the full content of the article.',
    authorId: 'author-1',
  };

  describe('static create()', () => {
    it('should create an unpublished article by default', () => {
      const article = BlogArticle.create(validParams);

      expect(article.isPublished()).toBe(false);
      expect(article.getPublishedAt()).toBeNull();
    });

    it('should set publishedAt when isPublished is true', () => {
      const before = new Date();
      const article = BlogArticle.create({
        ...validParams,
        isPublished: true,
      });
      const after = new Date();

      expect(article.isPublished()).toBe(true);
      expect(article.getPublishedAt()).not.toBeNull();
      expect(article.getPublishedAt()!.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(article.getPublishedAt()!.getTime()).toBeLessThanOrEqual(
        after.getTime()
      );
    });

    it('should calculate reading time from content', () => {
      const article = BlogArticle.create(validParams);

      expect(article.getReadingTime()).toBeGreaterThanOrEqual(1);
    });

    it('should use provided reading time', () => {
      const article = BlogArticle.create({
        ...validParams,
        readingTime: 15,
      });

      expect(article.getReadingTime()).toBe(15);
    });
  });

  describe('publish()', () => {
    it('should set isPublished and publishedAt', () => {
      const article = BlogArticle.create(validParams);

      expect(article.isPublished()).toBe(false);
      expect(article.getPublishedAt()).toBeNull();

      const before = new Date();
      article.publish();
      const after = new Date();

      expect(article.isPublished()).toBe(true);
      expect(article.getPublishedAt()).not.toBeNull();
      expect(article.getPublishedAt()!.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(article.getPublishedAt()!.getTime()).toBeLessThanOrEqual(
        after.getTime()
      );
    });

    it('should not update publishedAt if already published', () => {
      const article = BlogArticle.create(validParams);
      article.publish();
      const firstPublishedAt = article.getPublishedAt();

      // Wait a tiny bit to ensure time difference
      article.publish();

      expect(article.getPublishedAt()).toBe(firstPublishedAt);
    });
  });

  describe('unpublish()', () => {
    it('should set isPublished to false but keep publishedAt', () => {
      const article = BlogArticle.create(validParams);
      article.publish();
      const publishedAt = article.getPublishedAt();

      article.unpublish();

      expect(article.isPublished()).toBe(false);
      // publishedAt should be preserved for history
      expect(article.getPublishedAt()).toBe(publishedAt);
    });
  });

  describe('validation', () => {
    it('should throw error for empty ID', () => {
      expect(() =>
        BlogArticle.create({ ...validParams, id: '' })
      ).toThrow('Article ID cannot be empty');
    });

    it('should throw error for empty slug', () => {
      expect(() =>
        BlogArticle.create({ ...validParams, slug: '' })
      ).toThrow('Article slug cannot be empty');
    });

    it('should throw error for invalid slug format', () => {
      expect(() =>
        BlogArticle.create({ ...validParams, slug: 'Invalid Slug!' })
      ).toThrow('Article slug must be URL-friendly');
    });

    it('should throw error for empty title', () => {
      expect(() =>
        BlogArticle.create({ ...validParams, title: '' })
      ).toThrow('Article title cannot be empty');
    });

    it('should throw error for empty excerpt', () => {
      expect(() =>
        BlogArticle.create({ ...validParams, excerpt: '' })
      ).toThrow('Article excerpt cannot be empty');
    });

    it('should throw error for empty content', () => {
      expect(() =>
        BlogArticle.create({ ...validParams, content: '' })
      ).toThrow('Article content cannot be empty');
    });

    it('should throw error for empty authorId', () => {
      expect(() =>
        BlogArticle.create({ ...validParams, authorId: '' })
      ).toThrow('Author ID cannot be empty');
    });
  });

  describe('mutations', () => {
    let article: BlogArticle;

    beforeEach(() => {
      article = BlogArticle.create(validParams);
    });

    it('should update slug', () => {
      article.updateSlug('new-slug');
      expect(article.getSlug()).toBe('new-slug');
    });

    it('should update title', () => {
      article.updateTitle('New Title');
      expect(article.getTitle()).toBe('New Title');
    });

    it('should update excerpt', () => {
      article.updateExcerpt('New excerpt');
      expect(article.getExcerpt()).toBe('New excerpt');
    });

    it('should update content and recalculate reading time', () => {
      const longContent = 'word '.repeat(1000); // 1000 words = ~5 min
      article.updateContent(longContent);
      expect(article.getContent()).toBe(longContent);
      expect(article.getReadingTime()).toBe(5);
    });

    it('should update reading time', () => {
      article.updateReadingTime(20);
      expect(article.getReadingTime()).toBe(20);
    });

    it('should throw error for reading time less than 1', () => {
      expect(() => article.updateReadingTime(0)).toThrow(
        'Reading time must be at least 1 minute'
      );
    });
  });
});
