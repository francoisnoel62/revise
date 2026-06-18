// ABOUTME: Builds the [CHAPITRES PRÉCÉDENTS] context block for autocompletion
// ABOUTME: Threshold logic: full manuscript ≤40k words, last 5 chapters >40k

import { extractChapterText } from './project-text';

export interface ManuscriptChapter {
  getTitle(): string;
  getContent(): string;
}

const WORD_THRESHOLD = 40_000;
const MAX_RECENT_CHAPTERS = 5;

export class ManuscriptContextBuilder {
  build(previousChapters: ManuscriptChapter[]): string {
    if (previousChapters.length === 0) return '';

    const totalWords = previousChapters.reduce((sum, ch) => sum + countWords(ch), 0);

    const chaptersToInclude =
      totalWords <= WORD_THRESHOLD
        ? previousChapters
        : previousChapters.slice(-MAX_RECENT_CHAPTERS);

    const parts = chaptersToInclude
      .map((ch) => {
        const text = extractChapterText(ch);
        return text.trim() ? `## ${ch.getTitle()}\n\n${text}` : null;
      })
      .filter((p): p is string => p !== null);

    if (parts.length === 0) return '';

    return `[CHAPITRES PRÉCÉDENTS]\n${parts.join('\n\n---\n\n')}`;
  }
}

function countWords(chapter: ManuscriptChapter): number {
  const text = extractChapterText(chapter);
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}
