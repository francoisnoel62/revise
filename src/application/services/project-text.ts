// ABOUTME: Canonical extraction of a project's full text for AI analysis (hashing / generation).
// ABOUTME: Mirrors the extraction used by the metadata generation use cases.

interface ChapterLike {
  getContent(): string;
  getTitle(): string;
}

/**
 * Extract the canonical full text of a project: each chapter rendered as
 * "# title\n\n<text>", chapters joined by "\n\n---\n\n". Chapters with no
 * extractable text are skipped.
 */
export function extractProjectFullText(chapters: ChapterLike[]): string {
  const parts: string[] = [];

  for (const chapter of chapters) {
    const title = chapter.getTitle();
    const content = chapter.getContent();

    try {
      const json = JSON.parse(content);
      const text = extractTextFromTipTapJSON(json);
      if (text.trim()) {
        parts.push(`# ${title}\n\n${text}`);
      }
    } catch {
      // Skip chapters with invalid JSON
    }
  }

  return parts.join('\n\n---\n\n');
}

/**
 * Extract the plain text of a single chapter (no title). Returns '' if the
 * content is not valid TipTap JSON.
 */
export function extractChapterText(chapter: ChapterLike): string {
  try {
    return extractTextFromTipTapJSON(JSON.parse(chapter.getContent()));
  } catch {
    return '';
  }
}

function extractTextFromTipTapJSON(json: unknown): string {
  if (!json || typeof json !== 'object') return '';

  const node = json as Record<string, unknown>;

  if (node.type === 'text' && typeof node.text === 'string') {
    return node.text;
  }

  if (Array.isArray(node.content)) {
    return node.content
      .map((child) => extractTextFromTipTapJSON(child))
      .join(node.type === 'paragraph' ? '\n' : ' ');
  }

  return '';
}
