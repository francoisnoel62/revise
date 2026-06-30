// ABOUTME: Tests for PropositionInserter — TDD anchor for issue #135.
// ABOUTME: Covers plain-text proposal → semantic TipTap content conversion.

import { describe, it, expect } from 'vitest';
import { buildSemanticInsertContent, getSemanticRoleFromAttrs } from '../PropositionInserter';
import type { ContentNode } from '@/domain/value-objects/ContentNode';

describe('getSemanticRoleFromAttrs', () => {
  it('returns the semanticRole when it is a valid role', () => {
    expect(getSemanticRoleFromAttrs({ semanticRole: 'corps' })).toBe('corps');
    expect(getSemanticRoleFromAttrs({ semanticRole: 'citation' })).toBe('citation');
    expect(getSemanticRoleFromAttrs({ semanticRole: 'titre-de-chapitre' })).toBe('titre-de-chapitre');
  });

  it('falls back to corps when attrs is undefined', () => {
    expect(getSemanticRoleFromAttrs(undefined)).toBe('corps');
  });

  it('falls back to corps when semanticRole is missing from attrs', () => {
    expect(getSemanticRoleFromAttrs({ indent: true })).toBe('corps');
  });

  it('falls back to corps when semanticRole is an unknown string', () => {
    expect(getSemanticRoleFromAttrs({ semanticRole: 'unknown-role' })).toBe('corps');
  });

  it('falls back to corps when semanticRole is null', () => {
    expect(getSemanticRoleFromAttrs({ semanticRole: null })).toBe('corps');
  });
});

describe('buildSemanticInsertContent', () => {
  describe('single-paragraph proposals', () => {
    it('returns the text as-is for single-line text (inline insertion preserves host semanticRole)', () => {
      const result = buildSemanticInsertContent(
        'Une belle phrase réécrite.',
        'corps'
      );
      expect(result).toBe('Une belle phrase réécrite.');
    });

    it('returns the text as-is for text without paragraph breaks', () => {
      const result = buildSemanticInsertContent(
        'Phrase avec une virgule, une pause.',
        'corps'
      );
      expect(typeof result).toBe('string');
    });

    it('collapses single newlines into spaces for inline-safe insertion', () => {
      const result = buildSemanticInsertContent('Ligne un.\nLigne deux.', 'corps');
      expect(result).toBe('Ligne un. Ligne deux.');
    });

    it('trims leading and trailing whitespace from single-paragraph text', () => {
      const result = buildSemanticInsertContent('  Texte.  ', 'corps');
      expect(result).toBe('Texte.');
    });

    it('works for titre-de-chapitre role with single-line text', () => {
      const result = buildSemanticInsertContent('Titre du chapitre', 'titre-de-chapitre');
      expect(result).toBe('Titre du chapitre');
    });
  });

  describe('multi-paragraph proposals', () => {
    it('returns ContentNode[] for text with double newlines', () => {
      const result = buildSemanticInsertContent(
        'Premier paragraphe.\n\nDeuxième paragraphe.',
        'corps'
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('each returned node is a paragraph with the provided semanticRole', () => {
      const result = buildSemanticInsertContent(
        'Premier paragraphe.\n\nDeuxième paragraphe.',
        'corps'
      ) as ContentNode[];

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        type: 'paragraph',
        attrs: { semanticRole: 'corps' },
      });
      expect(result[1]).toMatchObject({
        type: 'paragraph',
        attrs: { semanticRole: 'corps' },
      });
    });

    it('each node contains the correct text content', () => {
      const result = buildSemanticInsertContent(
        'Premier paragraphe.\n\nDeuxième paragraphe.',
        'corps'
      ) as ContentNode[];

      expect(result[0].content?.[0]).toMatchObject({ type: 'text', text: 'Premier paragraphe.' });
      expect(result[1].content?.[0]).toMatchObject({ type: 'text', text: 'Deuxième paragraphe.' });
    });

    it('handles three or more paragraphs', () => {
      const result = buildSemanticInsertContent(
        'Un.\n\nDeux.\n\nTrois.',
        'corps'
      ) as ContentNode[];

      expect(result).toHaveLength(3);
      expect(result[2].content?.[0]).toMatchObject({ type: 'text', text: 'Trois.' });
    });

    it('uses the provided semanticRole for all created nodes', () => {
      const result = buildSemanticInsertContent(
        'First.\n\nSecond.',
        'citation'
      ) as ContentNode[];

      expect(result[0].attrs?.semanticRole).toBe('citation');
      expect(result[1].attrs?.semanticRole).toBe('citation');
    });

    it('filters out blank paragraphs from extra blank lines', () => {
      const result = buildSemanticInsertContent(
        'Premier.\n\n\n\nDeuxième.',
        'corps'
      ) as ContentNode[];

      expect(result).toHaveLength(2);
    });

    it('trims whitespace from individual paragraph text', () => {
      const result = buildSemanticInsertContent(
        '  Premier.  \n\n  Deuxième.  ',
        'corps'
      ) as ContentNode[];

      expect(result[0].content?.[0]).toMatchObject({ type: 'text', text: 'Premier.' });
      expect(result[1].content?.[0]).toMatchObject({ type: 'text', text: 'Deuxième.' });
    });
  });
});
