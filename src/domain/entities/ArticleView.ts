// ABOUTME: Domain entity representing a single blog article view
// ABOUTME: Tracks visitor fingerprint to prevent duplicate counting

export interface ArticleViewProperties {
  viewedAt: Date;
}

export class ArticleView {
  private readonly id: string;
  private readonly articleId: string;
  private readonly visitorHash: string;
  private readonly properties: ArticleViewProperties;

  constructor(
    id: string,
    articleId: string,
    visitorHash: string,
    properties?: Partial<ArticleViewProperties>
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('ArticleView ID cannot be empty');
    }

    if (!articleId || articleId.trim().length === 0) {
      throw new Error('Article ID cannot be empty');
    }

    if (!visitorHash || visitorHash.trim().length === 0) {
      throw new Error('Visitor hash cannot be empty');
    }

    this.id = id;
    this.articleId = articleId;
    this.visitorHash = visitorHash;
    this.properties = {
      viewedAt: properties?.viewedAt ?? new Date(),
    };
  }

  getId(): string {
    return this.id;
  }

  getArticleId(): string {
    return this.articleId;
  }

  getVisitorHash(): string {
    return this.visitorHash;
  }

  getViewedAt(): Date {
    return this.properties.viewedAt;
  }

  static create(params: {
    id: string;
    articleId: string;
    visitorHash: string;
  }): ArticleView {
    return new ArticleView(params.id, params.articleId, params.visitorHash);
  }
}
