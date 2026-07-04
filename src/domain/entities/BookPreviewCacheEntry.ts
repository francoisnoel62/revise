// ABOUTME: Cache metrics for a project's whole-book PDF preview, keyed by {projectId, profileId, ownerId}.
// ABOUTME: Stores physical chapter page offsets (for #page=N navigation) and a contentHash for invalidation.

import type { PublicationProfileId } from '../value-objects/PublicationProfile';

/** Physical 1-indexed PDF page on which a chapter starts (liminal pages included). */
export interface ChapterPageOffset {
  readonly chapterId: string;
  readonly pageNumber: number;
}

export interface BookPreviewCacheProperties {
  readonly projectId: string;
  readonly profileId: PublicationProfileId;
  readonly ownerId: string;
  readonly contentHash: string;
  /** Number of physical liminal pages (front matter + TOC) preceding the body. */
  readonly frontMatterPageCount: number;
  readonly totalPageCount: number;
  readonly chapterOffsets: readonly ChapterPageOffset[];
  readonly computedAt: Date;
}

export type CreateBookPreviewCacheProps = Omit<BookPreviewCacheProperties, 'computedAt'>;

export class BookPreviewCacheEntry {
  private constructor(private readonly properties: BookPreviewCacheProperties) {
    this.validate(properties);
  }

  private validate(props: BookPreviewCacheProperties): void {
    if (!props.contentHash || props.contentHash.trim().length === 0) {
      throw new Error('contentHash is required');
    }
    if (!Number.isInteger(props.frontMatterPageCount) || props.frontMatterPageCount < 0) {
      throw new Error('frontMatterPageCount must be a non-negative integer');
    }
    if (!Number.isInteger(props.totalPageCount) || props.totalPageCount < 0) {
      throw new Error('totalPageCount must be a non-negative integer');
    }
  }

  static create(props: CreateBookPreviewCacheProps, computedAt: Date): BookPreviewCacheEntry {
    return new BookPreviewCacheEntry({ ...props, computedAt });
  }

  static reconstruct(props: BookPreviewCacheProperties): BookPreviewCacheEntry {
    return new BookPreviewCacheEntry(props);
  }

  getProjectId(): string {
    return this.properties.projectId;
  }
  getProfileId(): PublicationProfileId {
    return this.properties.profileId;
  }
  getOwnerId(): string {
    return this.properties.ownerId;
  }
  getContentHash(): string {
    return this.properties.contentHash;
  }
  getFrontMatterPageCount(): number {
    return this.properties.frontMatterPageCount;
  }
  getTotalPageCount(): number {
    return this.properties.totalPageCount;
  }
  getChapterOffsets(): readonly ChapterPageOffset[] {
    return this.properties.chapterOffsets;
  }
  getComputedAt(): Date {
    return this.properties.computedAt;
  }

  /** Physical PDF page where a chapter starts, or null if the chapter is unknown. */
  pageForChapter(chapterId: string): number | null {
    const offset = this.properties.chapterOffsets.find((o) => o.chapterId === chapterId);
    return offset ? offset.pageNumber : null;
  }
}
