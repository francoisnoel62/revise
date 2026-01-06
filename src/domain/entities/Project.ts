// ABOUTME: Aggregate root managing a collection of chapters with active chapter tracking
// ABOUTME: Provides operations for chapter management, ordering, and project-level metadata

import { Chapter } from './Chapter';

export class Project {
  private chapters: Chapter[];
  private activeChapterId: string | null;

  constructor(chapters: Chapter[] = []) {
    this.chapters = [...chapters]; // Defensive copy
    this.activeChapterId = chapters.length > 0 ? chapters[0].getId() : null;
  }

  // Query methods
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

  // Command methods
  setActiveChapter(chapterId: string): void {
    const chapter = this.getChapter(chapterId);
    if (!chapter) {
      throw new Error(`Chapter with id ${chapterId} not found`);
    }
    this.activeChapterId = chapterId;
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
  }

  removeChapter(chapterId: string): void {
    const index = this.chapters.findIndex((c) => c.getId() === chapterId);
    if (index === -1) {
      throw new Error(`Chapter with id ${chapterId} not found`);
    }

    this.chapters.splice(index, 1);

    // Update active chapter if we removed it
    if (this.activeChapterId === chapterId) {
      this.activeChapterId = this.chapters.length > 0 ? this.chapters[0].getId() : null;
    }
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
  }

  isEmpty(): boolean {
    return this.chapters.length === 0;
  }
}
