// ABOUTME: Use case for recording a blog article view
// ABOUTME: Uses visitor fingerprint (IP + User-Agent hash) to prevent duplicate counting

import { randomUUID } from 'node:crypto';
import { ArticleView } from '../../domain/entities/ArticleView';
import { ArticleViewRepository } from '../../domain/interfaces/ArticleViewRepository';
import { BlogArticleRepository } from '../../domain/interfaces/BlogArticleRepository';

export interface RecordArticleViewInput {
  articleId: string;
  visitorIp: string;
  userAgent: string;
}

export interface RecordArticleViewResult {
  recorded: boolean;
  newViewCount: number | null;
}

export class RecordArticleViewUseCase {
  constructor(
    private readonly articleViewRepository: ArticleViewRepository,
    private readonly blogArticleRepository: BlogArticleRepository,
    private readonly hashFunction: (text: string) => string
  ) {}

  async execute(input: RecordArticleViewInput): Promise<RecordArticleViewResult> {
    // Validate input
    if (!input.articleId || input.articleId.trim().length === 0) {
      throw new Error('Article ID is required');
    }

    if (!input.visitorIp || input.visitorIp.trim().length === 0) {
      throw new Error('Visitor IP is required');
    }

    // Generate visitor fingerprint hash (anonymized)
    const visitorHash = this.hashFunction(
      `${input.articleId}:${input.visitorIp}:${input.userAgent || 'unknown'}`
    );

    // Check if visitor has already viewed this article recently
    const hasRecentView = await this.articleViewRepository.hasRecentView(
      input.articleId,
      visitorHash
    );

    if (hasRecentView) {
      return { recorded: false, newViewCount: null };
    }

    // Record the new view
    const view = ArticleView.create({
      id: randomUUID(),
      articleId: input.articleId,
      visitorHash,
    });

    await this.articleViewRepository.create(view);

    // Increment the article's view count
    const newViewCount = await this.blogArticleRepository.incrementViewCount(
      input.articleId
    );

    return { recorded: true, newViewCount };
  }
}
