// ABOUTME: Domain entity representing a blog article
// ABOUTME: Public content with admin-only management

export interface BlogArticleProperties {
  readingTime: number;
  isPublished: boolean;
  publishedAt: Date | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BlogArticle {
  private readonly id: string;
  private slug: string;
  private title: string;
  private excerpt: string;
  private content: string; // Markdown content
  private properties: BlogArticleProperties;

  constructor(
    id: string,
    slug: string,
    title: string,
    excerpt: string,
    content: string,
    properties: Partial<BlogArticleProperties> & { authorId: string }
  ) {
    // Validate ID
    if (!id || id.trim().length === 0) {
      throw new Error('Article ID cannot be empty');
    }

    // Validate slug
    if (!slug || slug.trim().length === 0) {
      throw new Error('Article slug cannot be empty');
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error(
        'Article slug must be URL-friendly (lowercase, hyphens only)'
      );
    }

    // Validate title
    if (!title || title.trim().length === 0) {
      throw new Error('Article title cannot be empty');
    }

    // Validate excerpt
    if (!excerpt || excerpt.trim().length === 0) {
      throw new Error('Article excerpt cannot be empty');
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      throw new Error('Article content cannot be empty');
    }

    // Validate authorId
    if (!properties.authorId || properties.authorId.trim().length === 0) {
      throw new Error('Author ID cannot be empty');
    }

    this.id = id;
    this.slug = slug.toLowerCase();
    this.title = title.trim();
    this.excerpt = excerpt.trim();
    this.content = content;

    const now = new Date();
    this.properties = {
      readingTime: properties.readingTime ?? this.calculateReadingTime(content),
      isPublished: properties.isPublished ?? false,
      publishedAt: properties.publishedAt ?? null,
      authorId: properties.authorId,
      createdAt: properties.createdAt ?? now,
      updatedAt: properties.updatedAt ?? now,
    };
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getSlug(): string {
    return this.slug;
  }

  getTitle(): string {
    return this.title;
  }

  getExcerpt(): string {
    return this.excerpt;
  }

  getContent(): string {
    return this.content;
  }

  getReadingTime(): number {
    return this.properties.readingTime;
  }

  isPublished(): boolean {
    return this.properties.isPublished;
  }

  getPublishedAt(): Date | null {
    return this.properties.publishedAt;
  }

  getAuthorId(): string {
    return this.properties.authorId;
  }

  getCreatedAt(): Date {
    return this.properties.createdAt;
  }

  getUpdatedAt(): Date {
    return this.properties.updatedAt;
  }

  getProperties(): BlogArticleProperties {
    return { ...this.properties };
  }

  // Mutations
  updateSlug(newSlug: string): void {
    if (!newSlug || newSlug.trim().length === 0) {
      throw new Error('Article slug cannot be empty');
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(newSlug)) {
      throw new Error(
        'Article slug must be URL-friendly (lowercase, hyphens only)'
      );
    }
    this.slug = newSlug.toLowerCase();
    this.properties.updatedAt = new Date();
  }

  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new Error('Article title cannot be empty');
    }
    this.title = newTitle.trim();
    this.properties.updatedAt = new Date();
  }

  updateExcerpt(newExcerpt: string): void {
    if (!newExcerpt || newExcerpt.trim().length === 0) {
      throw new Error('Article excerpt cannot be empty');
    }
    this.excerpt = newExcerpt.trim();
    this.properties.updatedAt = new Date();
  }

  updateContent(newContent: string): void {
    if (!newContent || newContent.trim().length === 0) {
      throw new Error('Article content cannot be empty');
    }
    this.content = newContent;
    this.properties.readingTime = this.calculateReadingTime(newContent);
    this.properties.updatedAt = new Date();
  }

  updateReadingTime(minutes: number): void {
    if (minutes < 1) {
      throw new Error('Reading time must be at least 1 minute');
    }
    this.properties.readingTime = Math.round(minutes);
    this.properties.updatedAt = new Date();
  }

  publish(): void {
    if (!this.properties.isPublished) {
      this.properties.isPublished = true;
      this.properties.publishedAt = new Date();
      this.properties.updatedAt = new Date();
    }
  }

  unpublish(): void {
    if (this.properties.isPublished) {
      this.properties.isPublished = false;
      this.properties.updatedAt = new Date();
    }
  }

  // Static factory for creating a new article
  static create(params: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    authorId: string;
    readingTime?: number;
    isPublished?: boolean;
  }): BlogArticle {
    return new BlogArticle(
      params.id,
      params.slug,
      params.title,
      params.excerpt,
      params.content,
      {
        authorId: params.authorId,
        readingTime: params.readingTime,
        isPublished: params.isPublished ?? false,
      }
    );
  }

  // Static factory for seeding from existing static data
  static createFromSeed(params: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    readingTime: number;
    publishedAt: Date;
    authorId: string;
  }): BlogArticle {
    return new BlogArticle(
      params.id,
      params.slug,
      params.title,
      params.excerpt,
      params.content,
      {
        authorId: params.authorId,
        readingTime: params.readingTime,
        isPublished: true,
        publishedAt: params.publishedAt,
        createdAt: params.publishedAt,
        updatedAt: params.publishedAt,
      }
    );
  }

  // Private helpers
  private calculateReadingTime(content: string): number {
    // Average reading speed: 200 words per minute
    const wordCount = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 200);
    return Math.max(1, minutes);
  }
}
