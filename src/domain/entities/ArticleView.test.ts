// ABOUTME: Unit tests for ArticleView entity
// ABOUTME: Tests creation, validation, and getters

import { describe, it, expect } from 'vitest';
import { ArticleView } from './ArticleView';

describe('ArticleView', () => {
  const validParams = {
    id: 'view-123',
    articleId: 'article-456',
    visitorHash: 'abc123def456',
  };

  describe('constructor validation', () => {
    it('creates an ArticleView with valid params', () => {
      const view = new ArticleView(
        validParams.id,
        validParams.articleId,
        validParams.visitorHash
      );

      expect(view.getId()).toBe(validParams.id);
      expect(view.getArticleId()).toBe(validParams.articleId);
      expect(view.getVisitorHash()).toBe(validParams.visitorHash);
      expect(view.getViewedAt()).toBeInstanceOf(Date);
    });

    it('throws error for empty ID', () => {
      expect(() => {
        new ArticleView('', validParams.articleId, validParams.visitorHash);
      }).toThrow('ArticleView ID cannot be empty');
    });

    it('throws error for whitespace-only ID', () => {
      expect(() => {
        new ArticleView('  ', validParams.articleId, validParams.visitorHash);
      }).toThrow('ArticleView ID cannot be empty');
    });

    it('throws error for empty article ID', () => {
      expect(() => {
        new ArticleView(validParams.id, '', validParams.visitorHash);
      }).toThrow('Article ID cannot be empty');
    });

    it('throws error for empty visitor hash', () => {
      expect(() => {
        new ArticleView(validParams.id, validParams.articleId, '');
      }).toThrow('Visitor hash cannot be empty');
    });
  });

  describe('static create factory', () => {
    it('creates an ArticleView using factory method', () => {
      const view = ArticleView.create(validParams);

      expect(view.getId()).toBe(validParams.id);
      expect(view.getArticleId()).toBe(validParams.articleId);
      expect(view.getVisitorHash()).toBe(validParams.visitorHash);
    });
  });

  describe('viewedAt property', () => {
    it('uses current date when not provided', () => {
      const before = new Date();
      const view = new ArticleView(
        validParams.id,
        validParams.articleId,
        validParams.visitorHash
      );
      const after = new Date();

      expect(view.getViewedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(view.getViewedAt().getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('uses provided viewedAt when specified', () => {
      const customDate = new Date('2025-01-15T10:00:00Z');
      const view = new ArticleView(
        validParams.id,
        validParams.articleId,
        validParams.visitorHash,
        { viewedAt: customDate }
      );

      expect(view.getViewedAt()).toEqual(customDate);
    });
  });
});
