// ABOUTME: CanonFact entity — one atomic manuscript fact about a character with temporal validity
// ABOUTME: Carries provenance (derived/author) for refutability and a contentHash for freshness

import {
  CanonFactSource,
  isValidCanonFactSource,
} from '../value-objects/CanonFactSource';
import type { CanonFactCategory } from '../value-objects/CanonFacts';

export interface CanonFactProperties {
  id: string;
  ownerId: string;
  projectId: string;
  entity: string;
  statement: string;
  validFromChapter: number;
  validToChapter: number | null;
  source: CanonFactSource;
  sourceChapterId: string | null;
  contentHash: string | null;
  /** Narrative category 1-5; defaults to 1 (objectif) when absent from stored data */
  category?: CanonFactCategory;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCanonFactProps = Omit<CanonFactProperties, 'createdAt' | 'updatedAt'>;

export class CanonFact {
  private readonly id: string;
  private readonly ownerId: string;
  private readonly projectId: string;
  private readonly entity: string;
  private readonly statement: string;
  private readonly validFromChapter: number;
  private readonly validToChapter: number | null;
  private readonly source: CanonFactSource;
  private readonly sourceChapterId: string | null;
  private readonly contentHash: string | null;
  private readonly category: CanonFactCategory;
  private readonly createdAt: Date;
  private readonly updatedAt: Date;

  private constructor(props: CanonFactProperties) {
    this.validate(props);

    this.id = props.id;
    this.ownerId = props.ownerId;
    this.projectId = props.projectId;
    this.entity = props.entity;
    this.statement = props.statement;
    this.validFromChapter = props.validFromChapter;
    this.validToChapter = props.validToChapter;
    this.source = props.source;
    this.sourceChapterId = props.sourceChapterId;
    this.contentHash = props.contentHash;
    this.category = props.category ?? 1;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  private validate(props: CanonFactProperties): void {
    if (!props.entity || props.entity.trim().length === 0) {
      throw new Error('entity is required');
    }
    if (!props.statement || props.statement.trim().length === 0) {
      throw new Error('statement is required');
    }
    if (!isValidCanonFactSource(props.source)) {
      throw new Error(`Invalid source: ${props.source}`);
    }
    if (!Number.isInteger(props.validFromChapter) || props.validFromChapter < 0) {
      throw new Error('validFromChapter must be a non-negative integer');
    }
    if (props.validToChapter !== null) {
      if (!Number.isInteger(props.validToChapter) || props.validToChapter < 0) {
        throw new Error('validToChapter must be a non-negative integer or null');
      }
      if (props.validToChapter < props.validFromChapter) {
        throw new Error('validToChapter cannot be before validFromChapter');
      }
    }
  }

  static create(props: CreateCanonFactProps): CanonFact {
    const now = new Date();
    return new CanonFact({ ...props, createdAt: now, updatedAt: now });
  }

  static reconstruct(props: CanonFactProperties): CanonFact {
    return new CanonFact(props);
  }

  getId(): string {
    return this.id;
  }
  getOwnerId(): string {
    return this.ownerId;
  }
  getProjectId(): string {
    return this.projectId;
  }
  getEntity(): string {
    return this.entity;
  }
  getStatement(): string {
    return this.statement;
  }
  getValidFromChapter(): number {
    return this.validFromChapter;
  }
  getValidToChapter(): number | null {
    return this.validToChapter;
  }
  getSource(): CanonFactSource {
    return this.source;
  }
  getSourceChapterId(): string | null {
    return this.sourceChapterId;
  }
  getContentHash(): string | null {
    return this.contentHash;
  }
  getCategory(): CanonFactCategory {
    return this.category;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /** Return a copy with validToChapter set to the given chapter index. */
  withValidToChapter(validToChapter: number): CanonFact {
    return CanonFact.reconstruct({
      id: this.id,
      ownerId: this.ownerId,
      projectId: this.projectId,
      entity: this.entity,
      statement: this.statement,
      validFromChapter: this.validFromChapter,
      validToChapter,
      source: this.source,
      sourceChapterId: this.sourceChapterId,
      contentHash: this.contentHash,
      category: this.category,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
