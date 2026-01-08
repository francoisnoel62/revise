// ABOUTME: Project aggregate root representing a user's writing project.
// ABOUTME: Contains chapters and manages ownership for multi-tenant persistence.

import { randomUUID } from 'crypto';
import { Chapter } from './Chapter';

/**
 * Project aggregate root.
 * Manages a collection of chapters with ownership tracking.
 */
export class Project {
  private readonly id: string;
  private readonly ownerId: string;
  private title: string;
  private chapters: Chapter[];
  private activeChapterId: string | null;
  private providerId: string | null;
  private readonly createdAt: Date;
  private updatedAt: Date;

  /**
   * Reconstruct a Project from persisted data.
   * Use Project.create() for new projects.
   */
  constructor(
    id: string,
    ownerId: string,
    title: string,
    chapters: Chapter[],
    activeChapterId: string | null,
    providerId: string | null,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.ownerId = ownerId;
    this.title = title;
    this.chapters = [...chapters];
    this.activeChapterId = activeChapterId ?? (chapters.length > 0 ? chapters[0].getId() : null);
    this.providerId = providerId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Create a new Project with generated ID and timestamps.
   */
  static create(
    ownerId: string,
    title: string = 'Nouveau projet',
    chapters: Chapter[] = [],
    providerId: string | null = null
  ): Project {
    const now = new Date();
    return new Project(
      randomUUID(),
      ownerId,
      title,
      chapters,
      chapters.length > 0 ? chapters[0].getId() : null,
      providerId,
      now,
      now
    );
  }

  /**
   * Create an empty project for a new user.
   * Includes one default chapter.
   */
  static createEmpty(ownerId: string, title: string = 'Nouveau projet'): Project {
    const defaultChapter = new Chapter(
      randomUUID(),
      'Chapitre 1',
      JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
      0
    );
    return Project.create(ownerId, title, [defaultChapter]);
  }

  // === Getters ===

  getId(): string {
    return this.id;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getTitle(): string {
    return this.title;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getChapters(): Chapter[] {
    // Return sorted by order
    return [...this.chapters].sort((a, b) => a.getOrder() - b.getOrder());
  }

  getChapter(chapterId: string): Chapter | null {
    return this.chapters.find((c) => c.getId() === chapterId) || null;
  }

  getActiveChapter(): Chapter | null {
    if (!this.activeChapterId) return null;
    return this.getChapter(this.activeChapterId);
  }

  getActiveChapterId(): string | null {
    return this.activeChapterId;
  }

  getProviderId(): string | null {
    return this.providerId;
  }

  getChapterCount(): number {
    return this.chapters.length;
  }

  getTotalWordCount(): number {
    return this.chapters.reduce(
      (sum, chapter) => sum + chapter.getMetadata().wordCount,
      0
    );
  }

  getTotalCharacterCount(): number {
    return this.chapters.reduce(
      (sum, chapter) => sum + chapter.getMetadata().characterCount,
      0
    );
  }

  isEmpty(): boolean {
    return this.chapters.length === 0;
  }

  // === Mutations ===

  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim() === '') {
      throw new Error('Project title cannot be empty');
    }
    this.title = newTitle.trim();
    this.touch();
  }

  setActiveChapter(chapterId: string): void {
    const chapter = this.getChapter(chapterId);
    if (!chapter) {
      throw new Error(`Chapter with id ${chapterId} not found`);
    }
    this.activeChapterId = chapterId;
    this.touch();
  }

  setProviderId(providerId: string | null): void {
    this.providerId = providerId;
    this.touch();
  }

  addChapter(chapter: Chapter): void {
    const existingIds = this.chapters.map((c) => c.getId());
    if (existingIds.includes(chapter.getId())) {
      throw new Error(`Chapter with id ${chapter.getId()} already exists`);
    }

    this.chapters.push(chapter);

    // Set as active if it's the first chapter
    if (this.chapters.length === 1) {
      this.activeChapterId = chapter.getId();
    }

    this.touch();
  }

  removeChapter(chapterId: string): void {
    if (this.chapters.length <= 1) {
      throw new Error('Cannot remove the last chapter');
    }

    const index = this.chapters.findIndex((c) => c.getId() === chapterId);
    if (index === -1) {
      throw new Error(`Chapter with id ${chapterId} not found`);
    }

    this.chapters.splice(index, 1);

    // Update active chapter if we removed it
    if (this.activeChapterId === chapterId) {
      this.activeChapterId = this.chapters[0]?.getId() ?? null;
    }

    this.touch();
  }

  reorderChapters(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.chapters.length) {
      throw new Error(`Invalid fromIndex: ${fromIndex}`);
    }
    if (toIndex < 0 || toIndex >= this.chapters.length) {
      throw new Error(`Invalid toIndex: ${toIndex}`);
    }

    const sortedChapters = this.getChapters();
    const [movedChapter] = sortedChapters.splice(fromIndex, 1);
    sortedChapters.splice(toIndex, 0, movedChapter);

    // Update order property on all chapters
    sortedChapters.forEach((chapter, index) => {
      chapter.reorder(index);
    });

    this.chapters = sortedChapters;
    this.touch();
  }

  /**
   * Update the updatedAt timestamp.
   * Called automatically by mutation methods.
   */
  touch(): void {
    this.updatedAt = new Date();
  }
}
