// ABOUTME: Tests for ManuscriptContextBuilder — previous chapters context block
// ABOUTME: Covers both branches of the 40k-word threshold

import { describe, it, expect } from 'vitest';
import { ManuscriptContextBuilder } from '../ManuscriptContextBuilder';

function makeChapter(title: string, wordCount: number) {
  const words = Array.from({ length: wordCount }, (_, i) => `mot${i}`).join(' ');
  const content = JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: words }] }],
  });
  return {
    getTitle: () => title,
    getContent: () => content,
  };
}

describe('ManuscriptContextBuilder', () => {
  const builder = new ManuscriptContextBuilder();

  it('returns empty string when there are no previous chapters', () => {
    expect(builder.build([])).toBe('');
  });

  it('includes all chapters when total word count ≤ 40 000', () => {
    const chapters = [
      makeChapter('Chapitre 1', 10_000),
      makeChapter('Chapitre 2', 10_000),
      makeChapter('Chapitre 3', 10_000),
    ];
    const result = builder.build(chapters);
    expect(result).toContain('[CHAPITRES PRÉCÉDENTS]');
    expect(result).toContain('Chapitre 1');
    expect(result).toContain('Chapitre 2');
    expect(result).toContain('Chapitre 3');
  });

  it('includes only the last 5 chapters when total word count > 40 000', () => {
    const chapters = [
      makeChapter('Ch 1', 5_000),
      makeChapter('Ch 2', 5_000),
      makeChapter('Ch 3', 5_000),
      makeChapter('Ch 4', 5_000),
      makeChapter('Ch 5', 5_000),
      makeChapter('Ch 6', 5_000),
      makeChapter('Ch 7', 5_000),
      makeChapter('Ch 8', 5_000),
      makeChapter('Ch 9', 5_000),
    ];
    // 9 × 5 000 = 45 000 words → > 40k threshold
    const result = builder.build(chapters);
    expect(result).toContain('[CHAPITRES PRÉCÉDENTS]');
    // Last 5: Ch 5, 6, 7, 8, 9
    expect(result).not.toContain('Ch 1');
    expect(result).not.toContain('Ch 2');
    expect(result).not.toContain('Ch 3');
    expect(result).not.toContain('Ch 4');
    expect(result).toContain('Ch 5');
    expect(result).toContain('Ch 9');
  });

  it('returns empty string when all chapters have empty content', () => {
    const emptyChapter = { getTitle: () => 'Vide', getContent: () => '{}' };
    expect(builder.build([emptyChapter])).toBe('');
  });

  it('uses exactly the 40 000 word boundary (≤ includes all)', () => {
    const chapters = [makeChapter('Ch A', 20_000), makeChapter('Ch B', 20_000)];
    const result = builder.build(chapters);
    expect(result).toContain('Ch A');
    expect(result).toContain('Ch B');
  });

  it('formats each chapter with its title as a header', () => {
    const chapters = [makeChapter('Mon Chapitre', 100)];
    const result = builder.build(chapters);
    expect(result).toContain('## Mon Chapitre');
  });
});
