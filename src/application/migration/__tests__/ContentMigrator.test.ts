// ABOUTME: Unit tests for ContentMigrator — TDD anchor for issue #126.
// ABOUTME: Covers legacy TipTap JSON (fontFamily/fontSize/textAlign) → semantic content mapping.

import { describe, it, expect } from 'vitest';
import { migrateContent } from '../ContentMigrator';
import type { JSONContent } from '@tiptap/core';

function doc(...nodes: JSONContent[]): JSONContent {
  return { type: 'doc', content: nodes };
}

function textNode(text: string, ...markTypes: string[]): JSONContent {
  const marks = markTypes.map((type) => ({ type }));
  return { type: 'text', text, ...(marks.length ? { marks } : {}) };
}

function textNodeWithStyle(
  text: string,
  styleAttrs: Record<string, string>
): JSONContent {
  return {
    type: 'text',
    text,
    marks: [{ type: 'textStyle', attrs: styleAttrs }],
  };
}

function paragraph(
  attrs: Record<string, unknown> | null,
  ...children: JSONContent[]
): JSONContent {
  return {
    type: 'paragraph',
    ...(attrs ? { attrs } : {}),
    content: children,
  };
}

function heading(level: number, ...children: JSONContent[]): JSONContent {
  return {
    type: 'heading',
    attrs: { level },
    content: children,
  };
}

function headingWithStyle(
  level: number,
  text: string,
  styleAttrs: Record<string, string>
): JSONContent {
  return {
    type: 'heading',
    attrs: { level, textAlign: 'left' },
    content: [{ type: 'text', text, marks: [{ type: 'textStyle', attrs: styleAttrs }] }],
  };
}

const hr: JSONContent = { type: 'horizontalRule' };

describe('migrateContent', () => {
  describe('empty document', () => {
    it('returns empty doc unchanged', () => {
      const input = doc();
      const result = migrateContent(input);
      expect(result.content).toEqual(doc());
      expect(result.ambiguities).toHaveLength(0);
    });
  });

  describe('normal paragraph (corps)', () => {
    it('adds semanticRole=corps to plain paragraph', () => {
      const input = doc(paragraph(null, textNode('Hello world')));
      const result = migrateContent(input);

      const node = result.content.content![0];
      expect(node.attrs?.semanticRole).toBe('corps');
    });

    it('strips textStyle marks from paragraph text', () => {
      const input = doc(
        paragraph(
          { textAlign: 'justify' },
          textNodeWithStyle('Body text', { fontFamily: 'Georgia', fontSize: '11pt' })
        )
      );
      const result = migrateContent(input);

      const node = result.content.content![0];
      const textChild = node.content![0];
      expect(textChild.marks).toBeUndefined();
      expect(textChild.text).toBe('Body text');
    });

    it('removes textAlign justify attribute (presentation)', () => {
      const input = doc(
        paragraph(
          { textAlign: 'justify', indent: true },
          textNodeWithStyle('Body text', { fontFamily: 'Georgia' })
        )
      );
      const result = migrateContent(input);

      const node = result.content.content![0];
      expect(node.attrs?.textAlign).toBeUndefined();
      expect(node.attrs?.indent).toBe(true);
    });

    it('removes textAlign left attribute (presentation)', () => {
      const input = doc(
        paragraph({ textAlign: 'left' }, textNode('Body text'))
      );
      const result = migrateContent(input);

      const node = result.content.content![0];
      expect(node.attrs?.textAlign).toBeUndefined();
    });

    it('preserves text that has non-textStyle marks (bold, italic)', () => {
      const input = doc(
        paragraph(null, {
          type: 'text',
          text: 'Bold text',
          marks: [
            { type: 'bold' },
            { type: 'textStyle', attrs: { fontFamily: 'Georgia' } },
          ],
        })
      );
      const result = migrateContent(input);

      const textChild = result.content.content![0].content![0];
      expect(textChild.marks).toHaveLength(1);
      expect(textChild.marks![0].type).toBe('bold');
    });
  });

  describe('centered paragraph (ambiguous)', () => {
    it('marks centered paragraph as corps with ambiguity flagged', () => {
      const input = doc(
        paragraph({ textAlign: 'center' }, textNode('Possibly epigraph'))
      );
      const result = migrateContent(input);

      const node = result.content.content![0];
      expect(node.attrs?.semanticRole).toBe('corps');
      expect(node.attrs?.textAlign).toBe('center');
      expect(result.ambiguities).toHaveLength(1);
      expect(result.ambiguities[0].reason).toMatch(/centré|center/i);
    });

    it('reports ambiguity index matching node position in doc', () => {
      const input = doc(
        paragraph(null, textNode('Normal paragraph')),
        paragraph({ textAlign: 'center' }, textNode('Epigraph candidate'))
      );
      const result = migrateContent(input);

      expect(result.ambiguities[0].nodeIndex).toBe(1);
    });
  });

  describe('heading level 1 (titre-de-chapitre)', () => {
    it('strips textStyle marks from heading text', () => {
      const input = doc(
        headingWithStyle(1, 'Chapter One', { fontFamily: 'Georgia', fontSize: '14pt' })
      );
      const result = migrateContent(input);

      const node = result.content.content![0];
      expect(node.type).toBe('heading');
      expect(node.attrs?.level).toBe(1);
      const textChild = node.content![0];
      expect(textChild.marks).toBeUndefined();
    });

    it('removes textAlign attribute from heading (presentation)', () => {
      const input = doc(headingWithStyle(1, 'Chapter One', { fontFamily: 'Georgia' }));
      const result = migrateContent(input);

      const node = result.content.content![0];
      expect(node.attrs?.textAlign).toBeUndefined();
    });
  });

  describe('horizontalRule (séparateur-de-scène)', () => {
    it('passes horizontalRule through unchanged', () => {
      const input = doc(hr);
      const result = migrateContent(input);

      expect(result.content.content![0]).toEqual(hr);
    });
  });

  describe('mixed content', () => {
    it('migrates a realistic legacy chapter correctly', () => {
      const input = doc(
        headingWithStyle(1, 'Chapitre premier', { fontFamily: 'Georgia', fontSize: '14pt' }),
        paragraph(
          { textAlign: 'justify', indent: false },
          textNodeWithStyle('Premier paragraphe du chapitre.', {
            fontFamily: 'Georgia',
            fontSize: '11pt',
          })
        ),
        paragraph(
          { textAlign: 'center' },
          textNode('* * *')
        ),
        hr,
        paragraph(
          { textAlign: 'justify', indent: true },
          textNodeWithStyle('Deuxième paragraphe.', {
            fontFamily: 'Georgia',
            fontSize: '11pt',
          })
        )
      );

      const result = migrateContent(input);
      const nodes = result.content.content!;

      // Heading: textStyle stripped, textAlign removed
      expect(nodes[0].type).toBe('heading');
      expect(nodes[0].attrs?.textAlign).toBeUndefined();
      expect(nodes[0].content![0].marks).toBeUndefined();

      // First paragraph: corps, textStyle stripped, textAlign removed
      expect(nodes[1].attrs?.semanticRole).toBe('corps');
      expect(nodes[1].attrs?.textAlign).toBeUndefined();
      expect(nodes[1].content![0].marks).toBeUndefined();

      // Centered paragraph: corps, ambiguous, textAlign kept
      expect(nodes[2].attrs?.semanticRole).toBe('corps');
      expect(nodes[2].attrs?.textAlign).toBe('center');

      // HR: unchanged
      expect(nodes[3]).toEqual(hr);

      // Second paragraph: corps, indent preserved, textStyle stripped
      expect(nodes[4].attrs?.semanticRole).toBe('corps');
      expect(nodes[4].attrs?.indent).toBe(true);

      // One ambiguity for centered paragraph
      expect(result.ambiguities).toHaveLength(1);
      expect(result.ambiguities[0].nodeIndex).toBe(2);
    });
  });

  describe('idempotency', () => {
    it('does not change already-migrated content', () => {
      const alreadyMigrated = doc(
        { type: 'heading', attrs: { level: 1 }, content: [textNode('Title')] },
        paragraph({ semanticRole: 'corps' }, textNode('Body'))
      );

      const result = migrateContent(alreadyMigrated);
      expect(result.content).toEqual(alreadyMigrated);
      expect(result.wasAlreadyMigrated).toBe(true);
    });

    it('applying migration twice yields same result as once', () => {
      const input = doc(
        headingWithStyle(1, 'Chapter', { fontFamily: 'Georgia' }),
        paragraph(
          { textAlign: 'justify' },
          textNodeWithStyle('Body', { fontSize: '11pt' })
        )
      );

      const once = migrateContent(input);
      const twice = migrateContent(once.content);
      expect(twice.content).toEqual(once.content);
    });
  });

  describe('edge cases', () => {
    it('handles paragraph with no content', () => {
      const input = doc({ type: 'paragraph', content: [] });
      const result = migrateContent(input);
      expect(result.content.content![0].attrs?.semanticRole).toBe('corps');
    });

    it('handles heading level 2+ — only strips textStyle, no semanticRole added', () => {
      const input = doc({
        type: 'heading',
        attrs: { level: 2 },
        content: [
          { type: 'text', text: 'Section', marks: [{ type: 'textStyle', attrs: { fontFamily: 'Georgia' } }] },
        ],
      });
      const result = migrateContent(input);

      const node = result.content.content![0];
      expect(node.attrs?.level).toBe(2);
      expect(node.content![0].marks).toBeUndefined();
    });

    it('heading that duplicates chapter title (same text as chapter) is still migrated normally', () => {
      // Edge case from the plan: headings that duplicate the chapter title
      const input = doc(
        headingWithStyle(1, 'Chapitre premier', { fontFamily: 'Georgia' }),
        headingWithStyle(1, 'Chapitre premier', { fontFamily: 'Georgia' })
      );
      const result = migrateContent(input);

      const nodes = result.content.content!;
      expect(nodes[0].attrs?.textAlign).toBeUndefined();
      expect(nodes[1].attrs?.textAlign).toBeUndefined();
      expect(nodes[0].content![0].marks).toBeUndefined();
    });
  });
});
