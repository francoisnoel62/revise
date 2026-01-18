// ABOUTME: Domain entity representing cached spell check results for a chapter
// ABOUTME: Stores corrections with content hash for invalidation detection

import { SpellCheckCorrection, CorrectionType } from '../value-objects/SpellCheckCorrection';

export interface SpellCheckCorrectionData {
  original: string;
  corrected: string;
  type: CorrectionType;
  explanation: string;
}

export class SpellCheckCache {
  private readonly id: string;
  private readonly chapterId: string;
  private readonly projectId: string;
  private contentHash: string;
  private corrections: SpellCheckCorrection[];
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: string,
    chapterId: string,
    projectId: string,
    contentHash: string,
    corrections: SpellCheckCorrection[],
    createdAt?: Date,
    updatedAt?: Date
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('SpellCheckCache ID cannot be empty');
    }

    if (!chapterId || chapterId.trim().length === 0) {
      throw new Error('Chapter ID cannot be empty');
    }

    if (!projectId || projectId.trim().length === 0) {
      throw new Error('Project ID cannot be empty');
    }

    if (!contentHash || contentHash.trim().length === 0) {
      throw new Error('Content hash cannot be empty');
    }

    this.id = id.trim();
    this.chapterId = chapterId.trim();
    this.projectId = projectId.trim();
    this.contentHash = contentHash.trim();
    this.corrections = corrections;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? new Date();
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getChapterId(): string {
    return this.chapterId;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getContentHash(): string {
    return this.contentHash;
  }

  getCorrections(): SpellCheckCorrection[] {
    return [...this.corrections];
  }

  getCorrectionCount(): number {
    return this.corrections.length;
  }

  hasErrors(): boolean {
    return this.corrections.length > 0;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt.getTime());
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt.getTime());
  }

  /**
   * Check if the cache is valid for the given content hash.
   * Returns true if the hash matches, meaning the content hasn't changed.
   */
  isValidFor(contentHash: string): boolean {
    return this.contentHash === contentHash;
  }

  /**
   * Remove a correction from the cache after it has been applied.
   * Returns a new SpellCheckCache instance with the correction removed.
   * The content hash is updated since the content has changed.
   */
  removeCorrection(original: string, newContentHash: string): SpellCheckCache {
    const newCorrections = this.corrections.filter(
      (c) => c.original !== original
    );

    return new SpellCheckCache(
      this.id,
      this.chapterId,
      this.projectId,
      newContentHash,
      newCorrections,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Update the cache with new corrections and content hash.
   * Returns a new SpellCheckCache instance with the updated data.
   */
  update(contentHash: string, corrections: SpellCheckCorrection[]): SpellCheckCache {
    return new SpellCheckCache(
      this.id,
      this.chapterId,
      this.projectId,
      contentHash,
      corrections,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Create a serializable representation of the cache.
   */
  toDTO(): {
    id: string;
    chapterId: string;
    projectId: string;
    contentHash: string;
    corrections: SpellCheckCorrectionData[];
    correctionCount: number;
    hasErrors: boolean;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this.id,
      chapterId: this.chapterId,
      projectId: this.projectId,
      contentHash: this.contentHash,
      corrections: this.corrections.map((c) => ({
        original: c.original,
        corrected: c.corrected,
        type: c.type,
        explanation: c.explanation,
      })),
      correctionCount: this.corrections.length,
      hasErrors: this.corrections.length > 0,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
