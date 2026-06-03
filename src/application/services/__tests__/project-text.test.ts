// ABOUTME: Tests for extractProjectFullText — the canonical project text used for analysis hashing
// ABOUTME: Must match the extraction used by the metadata generation use cases

import { describe, it, expect } from 'vitest';
import { extractProjectFullText } from '../project-text';

const chapter = (title: string, text: string) => ({
  getTitle: () => title,
  getContent: () =>
    JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }),
});

describe('extractProjectFullText', () => {
  it('joins chapters as "# title\\n\\ntext" separated by ---', () => {
    const out = extractProjectFullText([chapter('Chapitre 1', 'Bonjour'), chapter('Chapitre 2', 'Monde')]);
    expect(out).toBe('# Chapitre 1\n\nBonjour\n\n---\n\n# Chapitre 2\n\nMonde');
  });

  it('skips chapters with no extractable text', () => {
    const empty = {
      getTitle: () => 'Vide',
      getContent: () => JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
    };
    const out = extractProjectFullText([empty, chapter('Ch', 'Texte')]);
    expect(out).toBe('# Ch\n\nTexte');
  });

  it('skips chapters with invalid JSON content', () => {
    const bad = { getTitle: () => 'X', getContent: () => 'not json' };
    expect(extractProjectFullText([bad])).toBe('');
  });

  it('returns empty string for no chapters', () => {
    expect(extractProjectFullText([])).toBe('');
  });
});
