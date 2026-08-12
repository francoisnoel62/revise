// ABOUTME: Computes a stable fingerprint of everything visible in the whole-book PDF preview.
// ABOUTME: Rule: "if it shows in the PDF, it enters the hash" — chapters, their order, and liminal fields.

import type { AnnexEntry, BackMatterData, FrontMatterData } from '@/domain/interfaces/DocumentExporter';
import { hashText } from '@/application/utils/text-hash';
import type { LevelStyleSetProperties } from '@/domain/value-objects/LevelStyleSet';
import type { TocDepth, TocStyle } from '@/domain/value-objects/TocPreferences';

// Bump when the paged renderer changes visible output. This keeps previously cached PDFs from
// surviving a deployment that fixes layout or folio logic but leaves manuscript data untouched.
export const BOOK_PREVIEW_RENDERER_REVISION = '2026-08-12-visible-blank-lines-v1';

export interface BookPreviewContentHashInput {
  /** Chapters in reading order; ordering is part of the fingerprint. */
  readonly chapters: ReadonlyArray<{ readonly id: string; readonly content: string }>;
  readonly frontMatter: FrontMatterData;
  readonly backMatter?: BackMatterData;
  /** Styles for the cache profile only; the profile id itself remains part of the key. */
  readonly levelStyles?: LevelStyleSetProperties;
  /** TOC settings; global to the project, but they change what's printed in the PDF. */
  readonly tocDepth?: TocDepth;
  readonly tocStyle?: TocStyle;
  /** Endnotes section heading; changing it changes what's printed, so it enters the hash. */
  readonly endnotesTitle?: string;
  /** Whether blank lines occupy a line; flipping it repaginates the book, so it enters the hash. */
  readonly honorBlankLines?: boolean;
  /** Explicit test/release override; production uses BOOK_PREVIEW_RENDERER_REVISION by default. */
  readonly rendererRevision?: string;
}

function normalizeAnnexes(annexes: readonly AnnexEntry[] | undefined) {
  return (annexes ?? []).map((a) => ({ title: a.title, content: a.content }));
}

/**
 * The publication profile is intentionally excluded: it is part of the cache key
 * ({projectId, profileId, ownerId}), not of the content. Two profiles of the same
 * manuscript share this content hash and live under distinct keys.
 */
export function computeBookPreviewContentHash(input: BookPreviewContentHashInput): string {
  const fm = input.frontMatter;
  const bm = input.backMatter;
  const normalized = {
    chapters: input.chapters.map((c) => ({ id: c.id, content: c.content })),
    frontMatter: {
      title: fm.title,
      subtitle: fm.subtitle ?? null,
      authorName: fm.authorName ?? null,
      dedicationContent: fm.dedicationContent ?? null,
      epigraphContent: fm.epigraphContent ?? null,
      copyrightYear: fm.copyrightYear ?? null,
      customAnnexes: normalizeAnnexes(fm.customAnnexes),
    },
    backMatter: bm
      ? {
          legalNoticeContent: bm.legalNoticeContent ?? null,
          isbn: bm.isbn ?? null,
          customAnnexes: normalizeAnnexes(bm.customAnnexes),
        }
      : null,
    levelStyles: input.levelStyles ?? null,
    tocDepth: input.tocDepth ?? null,
    tocStyle: input.tocStyle ?? null,
    endnotesTitle: input.endnotesTitle ?? null,
    honorBlankLines: input.honorBlankLines ?? false,
    rendererRevision: input.rendererRevision ?? BOOK_PREVIEW_RENDERER_REVISION,
  };

  return hashText(JSON.stringify(normalized));
}
