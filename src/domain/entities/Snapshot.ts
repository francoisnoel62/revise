// ABOUTME: Domain entity representing an immutable manual snapshot of a project
// ABOUTME: Captures the full manuscript and editorial metadata at a point in time

import { SnapshotType, isValidSnapshotType } from '../value-objects/SnapshotType';
import { Contributor } from '../value-objects/Contributor';
import { RelatedWork } from '../value-objects/RelatedWork';
import { PointOfView, NarrationTense, TargetAudience } from '../value-objects/NarrationSettings';

/** A chapter as captured inside a snapshot; a plain copy, not the live Chapter entity. */
export interface SnapshotChapter {
  id: string;
  title: string;
  content: string; // TipTap JSON stringified
  order: number;
}

/** Editorial metadata captured inside a snapshot — excludes automation and personal preferences. */
export interface SnapshotEditorialMetadata {
  title: string;
  subtitle?: string;
  summary: string;
  coverImageUrl?: string;
  genre: string;
  synopsis: string;
  pointOfView?: PointOfView;
  tense?: NarrationTense;
  targetAudience?: TargetAudience;
  isbn?: string;
  contributors: Contributor[];
  relatedWorks: RelatedWork[];
}

export interface SnapshotProperties {
  id: string;
  projectId: string;
  ownerId: string;
  authorId: string;
  number: number;
  type: SnapshotType;
  title: string;
  comment: string | null;
  projectTitle: string;
  chapters: SnapshotChapter[];
  editorialMetadata: SnapshotEditorialMetadata | null;
  createdAt?: Date;
}

export class Snapshot {
  private readonly id: string;
  private readonly projectId: string;
  private readonly ownerId: string;
  private readonly authorId: string;
  private readonly number: number;
  private readonly type: SnapshotType;
  private readonly title: string;
  private readonly comment: string | null;
  private readonly projectTitle: string;
  private readonly chapters: SnapshotChapter[];
  private readonly editorialMetadata: SnapshotEditorialMetadata | null;
  private readonly createdAt: Date;

  constructor(props: SnapshotProperties) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('Snapshot ID cannot be empty');
    }
    if (!props.projectId || props.projectId.trim().length === 0) {
      throw new Error('Project ID cannot be empty');
    }
    if (!props.ownerId || props.ownerId.trim().length === 0) {
      throw new Error('Owner ID cannot be empty');
    }
    if (!props.authorId || props.authorId.trim().length === 0) {
      throw new Error('Author ID cannot be empty');
    }
    if (!Number.isInteger(props.number) || props.number < 1) {
      throw new Error('Snapshot number must be a positive integer');
    }
    if (!isValidSnapshotType(props.type)) {
      throw new Error(`Invalid snapshot type: ${props.type}`);
    }
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('Snapshot title cannot be empty');
    }
    if (!props.chapters || props.chapters.length === 0) {
      throw new Error('Snapshot must capture at least one chapter');
    }

    this.id = props.id;
    this.projectId = props.projectId;
    this.ownerId = props.ownerId;
    this.authorId = props.authorId;
    this.number = props.number;
    this.type = props.type;
    this.title = props.title.trim();
    this.comment = props.comment?.trim() || null;
    this.projectTitle = props.projectTitle;
    this.chapters = props.chapters.map((chapter) => ({ ...chapter }));
    this.editorialMetadata = props.editorialMetadata
      ? {
          ...props.editorialMetadata,
          contributors: [...props.editorialMetadata.contributors],
          relatedWorks: [...props.editorialMetadata.relatedWorks],
        }
      : null;
    this.createdAt = props.createdAt ?? new Date();
  }

  getId(): string {
    return this.id;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getAuthorId(): string {
    return this.authorId;
  }

  getNumber(): number {
    return this.number;
  }

  getType(): SnapshotType {
    return this.type;
  }

  getTitle(): string {
    return this.title;
  }

  getComment(): string | null {
    return this.comment;
  }

  getProjectTitle(): string {
    return this.projectTitle;
  }

  getChapters(): SnapshotChapter[] {
    return this.chapters.map((chapter) => ({ ...chapter }));
  }

  getEditorialMetadata(): SnapshotEditorialMetadata | null {
    if (!this.editorialMetadata) return null;
    return {
      ...this.editorialMetadata,
      contributors: [...this.editorialMetadata.contributors],
      relatedWorks: [...this.editorialMetadata.relatedWorks],
    };
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt.getTime());
  }
}
