// ABOUTME: Computes a stable fingerprint of everything visible in the whole-book PDF preview.
// ABOUTME: Rule: "if it shows in the PDF, it enters the hash" — chapters, their order, and liminal fields.

import type { FrontMatterData } from '@/domain/interfaces/DocumentExporter';
import { hashText } from '@/application/utils/text-hash';
import type { LevelStyleSetProperties } from '@/domain/value-objects/LevelStyleSet';
import type { TocDepth, TocStyle } from '@/domain/value-objects/TocPreferences';

export interface BookPreviewContentHashInput {
  /** Chapters in reading order; ordering is part of the fingerprint. */
  readonly chapters: ReadonlyArray<{ readonly id: string; readonly content: string }>;
  readonly frontMatter: FrontMatterData;
  /** Styles for the cache profile only; the profile id itself remains part of the key. */
  readonly levelStyles?: LevelStyleSetProperties;
  /** TOC settings; global to the project, but they change what's printed in the PDF. */
  readonly tocDepth?: TocDepth;
  readonly tocStyle?: TocStyle;
}

/**
 * The publication profile is intentionally excluded: it is part of the cache key
 * ({projectId, profileId, ownerId}), not of the content. Two profiles of the same
 * manuscript share this content hash and live under distinct keys.
 */
export function computeBookPreviewContentHash(input: BookPreviewContentHashInput): string {
  const fm = input.frontMatter;
  const normalized = {
    chapters: input.chapters.map((c) => ({ id: c.id, content: c.content })),
    frontMatter: {
      title: fm.title,
      subtitle: fm.subtitle ?? null,
      authorName: fm.authorName ?? null,
      dedicationContent: fm.dedicationContent ?? null,
      copyrightContent: fm.copyrightContent ?? null,
      epigraphContent: fm.epigraphContent ?? null,
      isbn: fm.isbn ?? null,
      copyrightYear: fm.copyrightYear ?? null,
    },
    levelStyles: input.levelStyles ?? null,
    tocDepth: input.tocDepth ?? null,
    tocStyle: input.tocStyle ?? null,
  };

  return hashText(JSON.stringify(normalized));
}
