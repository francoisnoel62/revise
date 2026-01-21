// ABOUTME: Serialization utilities for ArticleView <-> MongoDB document conversion.
// ABOUTME: Handles domain entity reconstruction from database documents.

import { ArticleView } from '@/domain/entities/ArticleView';

/**
 * MongoDB document shape for ArticleView.
 */
export interface ArticleViewDocument {
  _id: string;
  articleId: string;
  visitorHash: string;
  viewedAt: Date;
}

/**
 * Convert ArticleView domain entity to MongoDB document.
 */
export function serializeArticleView(view: ArticleView): ArticleViewDocument {
  return {
    _id: view.getId(),
    articleId: view.getArticleId(),
    visitorHash: view.getVisitorHash(),
    viewedAt: view.getViewedAt(),
  };
}

/**
 * Reconstruct ArticleView domain entity from MongoDB document.
 */
export function deserializeArticleView(doc: ArticleViewDocument): ArticleView {
  return new ArticleView(doc._id, doc.articleId, doc.visitorHash, {
    viewedAt: new Date(doc.viewedAt),
  });
}
