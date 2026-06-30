// ABOUTME: Computes the first Arabic page number for each chapter in a book.
// ABOUTME: Accounts for break-before-right (chapters start on odd pages) and missing page counts.

export interface ChapterEntry {
  readonly id: string;
}

/**
 * Given ordered chapters and a map of known page counts, returns the start
 * page (1-indexed Arabic) for each chapter whose offset can be derived.
 *
 * Rules:
 * - Chapter 1 always starts at page 1.
 * - Each subsequent chapter starts on the next right-hand (odd) page after
 *   the previous chapter ends, matching CSS `break-before: right`.
 * - If the previous chapter ends on an odd page, one blank even page is
 *   inserted before the next chapter.
 * - Liminaire (front-matter) pages use Roman numerals and do NOT count
 *   toward the Arabic page total; chapter 1 always starts at Arabic 1.
 * - Computation stops at the first chapter whose page count is not in the
 *   cache; subsequent chapters are excluded from the result.
 */
export function computeBookOffsets(
  chapters: readonly ChapterEntry[],
  pageCountCache: ReadonlyMap<string, number>,
): Map<string, number> {
  const offsets = new Map<string, number>();
  let currentStart = 1;

  for (const chapter of chapters) {
    offsets.set(chapter.id, currentStart);

    const pageCount = pageCountCache.get(chapter.id);
    if (pageCount === undefined) {
      break;
    }

    const lastPage = currentStart + pageCount - 1;
    // Next chapter starts on the next odd page after lastPage.
    // If lastPage is even → next odd is lastPage + 1.
    // If lastPage is odd  → skip one blank page → next odd is lastPage + 2.
    currentStart = lastPage % 2 === 0 ? lastPage + 1 : lastPage + 2;
  }

  return offsets;
}
