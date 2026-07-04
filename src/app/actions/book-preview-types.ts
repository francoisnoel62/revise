// ABOUTME: Shared types + constants for the whole-book preview (client, route, and action can import).
// ABOUTME: Kept OUT of the 'use server' action module, which may only export async functions.

import type { PublicationProfileId } from '@/domain/value-objects/PublicationProfile';

/** The whole-book preview offers only the print (PDF) profiles; passerelle is excluded. */
export type BookPreviewProfileId = Extract<PublicationProfileId, 'kdp-6x9' | 'a5'>;
export const BOOK_PREVIEW_PROFILES: readonly BookPreviewProfileId[] = ['kdp-6x9', 'a5'];

export interface BookPreviewChapterNav {
  readonly id: string;
  readonly title: string;
  /** Physical 1-indexed PDF page where the chapter starts (for #page=N navigation). */
  readonly pageNumber: number;
}

export interface BookPreviewData {
  readonly projectTitle: string;
  readonly profileId: PublicationProfileId;
  /** True when the project's active profile is passerelle — no paginated whole-book preview. */
  readonly isPasserelle: boolean;
  readonly availableProfiles: readonly BookPreviewProfileId[];
  readonly chapters: readonly BookPreviewChapterNav[];
  readonly totalPageCount: number;
  readonly frontMatterPageCount: number;
}
