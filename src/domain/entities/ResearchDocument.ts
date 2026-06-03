// ABOUTME: Domain entity representing a research document in a writing project
// ABOUTME: Supports notes, links, quotes, and references with tagging and chapter linking

export type ResearchDocumentType = 'note' | 'link' | 'quote' | 'reference' | 'image';

export interface ResearchDocumentProperties {
  id: string;
  projectId: string;
  ownerId: string;
  type: ResearchDocumentType;
  title: string;
  content: Record<string, unknown> | null;
  url: string | null;
  sourceTitle: string | null;
  sourceAuthor: string | null;
  tags: string[];
  linkedChapterIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class ResearchDocument {
  private readonly id: string;
  private readonly projectId: string;
  private readonly ownerId: string;
  private readonly type: ResearchDocumentType;
  private title: string;
  private content: Record<string, unknown> | null;
  private url: string | null;
  private sourceTitle: string | null;
  private sourceAuthor: string | null;
  private tags: string[];
  private linkedChapterIds: string[];
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: ResearchDocumentProperties) {
    this.validateTitle(props.title);
    this.validateTypeConstraints(props.type, props);

    this.id = props.id;
    this.projectId = props.projectId;
    this.ownerId = props.ownerId;
    this.type = props.type;
    this.title = props.title.trim();
    this.content = props.content;
    this.url = props.url;
    this.sourceTitle = props.sourceTitle;
    this.sourceAuthor = props.sourceAuthor;
    this.tags = [...props.tags];
    this.linkedChapterIds = [...props.linkedChapterIds];
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Research document title cannot be empty');
    }
    if (title.length > 200) {
      throw new Error('Research document title cannot exceed 200 characters');
    }
  }

  private validateTypeConstraints(
    type: ResearchDocumentType,
    props: Partial<ResearchDocumentProperties>
  ): void {
    if (type === 'link' && !props.url) {
      throw new Error('Link type requires a URL');
    }
    if (type === 'quote' && !props.content) {
      throw new Error('Quote type requires content');
    }
  }

  static create(
    id: string,
    projectId: string,
    ownerId: string,
    type: ResearchDocumentType,
    title: string,
    options: {
      content?: Record<string, unknown>;
      url?: string;
      sourceTitle?: string;
      sourceAuthor?: string;
      tags?: string[];
      linkedChapterIds?: string[];
    } = {}
  ): ResearchDocument {
    const now = new Date();
    return new ResearchDocument({
      id,
      projectId,
      ownerId,
      type,
      title,
      content: options.content ?? null,
      url: options.url ?? null,
      sourceTitle: options.sourceTitle ?? null,
      sourceAuthor: options.sourceAuthor ?? null,
      tags: options.tags ?? [],
      linkedChapterIds: options.linkedChapterIds ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstruct(props: ResearchDocumentProperties): ResearchDocument {
    return new ResearchDocument(props);
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getType(): ResearchDocumentType {
    return this.type;
  }

  getTitle(): string {
    return this.title;
  }

  getContent(): Record<string, unknown> | null {
    return this.content ? { ...this.content } : null;
  }

  /** Plain text of the content (handles a plain { text } body and TipTap shapes), '' if none. */
  getContentText(): string {
    return ResearchDocument.extractText(this.content).trim();
  }

  private static extractText(value: unknown): string {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      return value.map((v) => ResearchDocument.extractText(v)).join(' ');
    }
    if (value && typeof value === 'object') {
      const node = value as Record<string, unknown>;
      const parts: string[] = [];
      if (typeof node.text === 'string') parts.push(node.text);
      if (Array.isArray(node.content)) parts.push(ResearchDocument.extractText(node.content));
      return parts.join(' ');
    }
    return '';
  }

  getUrl(): string | null {
    return this.url;
  }

  getSourceTitle(): string | null {
    return this.sourceTitle;
  }

  getSourceAuthor(): string | null {
    return this.sourceAuthor;
  }

  getTags(): string[] {
    return [...this.tags];
  }

  getLinkedChapterIds(): string[] {
    return [...this.linkedChapterIds];
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Computed properties
  hasUrl(): boolean {
    return this.url !== null && this.url.length > 0;
  }

  hasContent(): boolean {
    return this.content !== null;
  }

  hasSource(): boolean {
    return this.sourceTitle !== null || this.sourceAuthor !== null;
  }

  isLinkedToChapter(chapterId: string): boolean {
    return this.linkedChapterIds.includes(chapterId);
  }

  getTagCount(): number {
    return this.tags.length;
  }

  // Mutations (return new instance for immutability)
  updateTitle(title: string): ResearchDocument {
    this.validateTitle(title);
    return new ResearchDocument({
      ...this.toProperties(),
      title: title.trim(),
      updatedAt: new Date(),
    });
  }

  updateContent(content: Record<string, unknown> | null): ResearchDocument {
    return new ResearchDocument({
      ...this.toProperties(),
      content,
      updatedAt: new Date(),
    });
  }

  updateUrl(url: string | null): ResearchDocument {
    if (this.type === 'link' && !url) {
      throw new Error('Link type requires a URL');
    }
    return new ResearchDocument({
      ...this.toProperties(),
      url,
      updatedAt: new Date(),
    });
  }

  updateSource(sourceTitle: string | null, sourceAuthor: string | null): ResearchDocument {
    return new ResearchDocument({
      ...this.toProperties(),
      sourceTitle,
      sourceAuthor,
      updatedAt: new Date(),
    });
  }

  updateTags(tags: string[]): ResearchDocument {
    return new ResearchDocument({
      ...this.toProperties(),
      tags: [...tags],
      updatedAt: new Date(),
    });
  }

  addTag(tag: string): ResearchDocument {
    const normalizedTag = tag.trim().toLowerCase();
    if (this.tags.includes(normalizedTag)) {
      return this;
    }
    return new ResearchDocument({
      ...this.toProperties(),
      tags: [...this.tags, normalizedTag],
      updatedAt: new Date(),
    });
  }

  removeTag(tag: string): ResearchDocument {
    const normalizedTag = tag.trim().toLowerCase();
    if (!this.tags.includes(normalizedTag)) {
      return this;
    }
    return new ResearchDocument({
      ...this.toProperties(),
      tags: this.tags.filter((t) => t !== normalizedTag),
      updatedAt: new Date(),
    });
  }

  linkToChapter(chapterId: string): ResearchDocument {
    if (this.linkedChapterIds.includes(chapterId)) {
      return this;
    }
    return new ResearchDocument({
      ...this.toProperties(),
      linkedChapterIds: [...this.linkedChapterIds, chapterId],
      updatedAt: new Date(),
    });
  }

  unlinkFromChapter(chapterId: string): ResearchDocument {
    return new ResearchDocument({
      ...this.toProperties(),
      linkedChapterIds: this.linkedChapterIds.filter((id) => id !== chapterId),
      updatedAt: new Date(),
    });
  }

  private toProperties(): ResearchDocumentProperties {
    return {
      id: this.id,
      projectId: this.projectId,
      ownerId: this.ownerId,
      type: this.type,
      title: this.title,
      content: this.content ? { ...this.content } : null,
      url: this.url,
      sourceTitle: this.sourceTitle,
      sourceAuthor: this.sourceAuthor,
      tags: [...this.tags],
      linkedChapterIds: [...this.linkedChapterIds],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
