// ABOUTME: Tests inserting a missing titre-de-chapitre H1 into a chapter's body (one-shot migration).
// ABOUTME: Idempotent: a chapter that already starts with the semantic heading is left untouched.

import { describe, expect, it } from 'vitest';
import { ensureChapterTitleHeading } from './ChapterTitleHeadingMigration';
import type { ContentNode } from '@/domain/value-objects/ContentNode';

describe('ensureChapterTitleHeading', () => {
  it('inserts a titre-de-chapitre H1 in front of a chapter body that has none', () => {
    const content: ContentNode = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Corps.' }] }],
    };

    const result = ensureChapterTitleHeading(content, 'Chapitre Un');

    expect(result.wasAlreadyPresent).toBe(false);
    expect(result.content.content?.[0]).toMatchObject({
      type: 'heading',
      attrs: { level: 1, semanticRole: 'titre-de-chapitre' },
      content: [{ type: 'text', text: 'Chapitre Un' }],
    });
    expect(result.content.content?.[1]).toMatchObject({ type: 'paragraph' });
  });

  it('is idempotent: a chapter already starting with a titre-de-chapitre H1 is left unchanged', () => {
    const content: ContentNode = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1, semanticRole: 'titre-de-chapitre' },
          content: [{ type: 'text', text: 'Titre existant' }],
        },
        { type: 'paragraph', content: [{ type: 'text', text: 'Corps.' }] },
      ],
    };

    const result = ensureChapterTitleHeading(content, 'Chapitre Un');

    expect(result.wasAlreadyPresent).toBe(true);
    expect(result.content).toBe(content);
  });

  it('inserts a heading in an empty chapter body', () => {
    const content: ContentNode = { type: 'doc', content: [] };

    const result = ensureChapterTitleHeading(content, 'Chapitre Vide');

    expect(result.wasAlreadyPresent).toBe(false);
    expect(result.content.content).toHaveLength(1);
    expect(result.content.content?.[0]).toMatchObject({
      type: 'heading',
      attrs: { level: 1, semanticRole: 'titre-de-chapitre' },
    });
  });

  it('inserts a heading when the leading heading is level 1 but not titre-de-chapitre', () => {
    const content: ContentNode = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Sans rôle' }] },
      ],
    };

    const result = ensureChapterTitleHeading(content, 'Chapitre Un');

    expect(result.wasAlreadyPresent).toBe(false);
    expect(result.content.content).toHaveLength(2);
    expect(result.content.content?.[0]).toMatchObject({
      attrs: { semanticRole: 'titre-de-chapitre' },
    });
  });
});
