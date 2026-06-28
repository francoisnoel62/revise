// ABOUTME: Unit tests for ContentDemigrator — inverse of ContentMigrator.
// ABOUTME: Verifies that semanticRole attributes are stripped and nodesReverted is accurate.

import { describe, it, expect } from 'vitest';
import { demigrateContent } from '../ContentDemigrator';
import type { ContentNode } from '@/domain/value-objects/ContentNode';

function doc(...nodes: ContentNode[]): ContentNode {
  return { type: 'doc', content: nodes };
}

function paragraph(attrs: Record<string, unknown> | null, text: string): ContentNode {
  return {
    type: 'paragraph',
    ...(attrs ? { attrs } : {}),
    content: [{ type: 'text', text }],
  };
}

describe('demigrateContent', () => {
  describe('empty document', () => {
    it('returns empty doc unchanged with zero reverted', () => {
      const input = doc();
      const result = demigrateContent(input);
      expect(result.content).toEqual(doc());
      expect(result.nodesReverted).toBe(0);
    });
  });

  describe('paragraph with semanticRole', () => {
    it('removes semanticRole from paragraph', () => {
      const input = doc(paragraph({ semanticRole: 'corps', indent: true }, 'Hello'));
      const result = demigrateContent(input);

      const node = result.content.content![0];
      expect(node.attrs?.semanticRole).toBeUndefined();
    });

    it('preserves other attributes when removing semanticRole', () => {
      const input = doc(paragraph({ semanticRole: 'corps', indent: true }, 'Hello'));
      const result = demigrateContent(input);

      const node = result.content.content![0];
      expect(node.attrs?.indent).toBe(true);
    });

    it('counts each reverted node', () => {
      const input = doc(
        paragraph({ semanticRole: 'corps' }, 'First'),
        paragraph({ semanticRole: 'corps' }, 'Second'),
      );
      const result = demigrateContent(input);
      expect(result.nodesReverted).toBe(2);
    });
  });

  describe('heading with semanticRole', () => {
    it('removes semanticRole from heading', () => {
      const input = doc({
        type: 'heading',
        attrs: { level: 1, semanticRole: 'titre-de-chapitre' },
        content: [{ type: 'text', text: 'Chapter' }],
      });
      const result = demigrateContent(input);

      const node = result.content.content![0];
      expect(node.attrs?.semanticRole).toBeUndefined();
      expect(node.attrs?.level).toBe(1);
    });
  });

  describe('nodes without semanticRole', () => {
    it('leaves nodes without semanticRole unchanged', () => {
      const input = doc(paragraph({ indent: true }, 'Hello'));
      const result = demigrateContent(input);

      expect(result.content).toEqual(input);
      expect(result.nodesReverted).toBe(0);
    });

    it('passes horizontalRule through unchanged', () => {
      const hr: ContentNode = { type: 'horizontalRule' };
      const input = doc(hr);
      const result = demigrateContent(input);

      expect(result.content.content![0]).toEqual(hr);
      expect(result.nodesReverted).toBe(0);
    });
  });

  describe('mixed content', () => {
    it('reverts all semantic nodes in a realistic chapter', () => {
      const input = doc(
        {
          type: 'heading',
          attrs: { level: 1, semanticRole: 'titre-de-chapitre' },
          content: [{ type: 'text', text: 'Chapter One' }],
        },
        paragraph({ semanticRole: 'corps', indent: false }, 'First paragraph.'),
        paragraph({ semanticRole: 'corps', textAlign: 'center' }, '* * *'),
        { type: 'horizontalRule' },
        paragraph({ semanticRole: 'corps', indent: true }, 'Second paragraph.'),
      );

      const result = demigrateContent(input);
      const nodes = result.content.content!;

      expect(nodes[0].attrs?.semanticRole).toBeUndefined();
      expect(nodes[0].attrs?.level).toBe(1);
      expect(nodes[1].attrs?.semanticRole).toBeUndefined();
      expect(nodes[2].attrs?.semanticRole).toBeUndefined();
      expect(nodes[2].attrs?.textAlign).toBe('center');
      expect(nodes[3]).toEqual({ type: 'horizontalRule' });
      expect(nodes[4].attrs?.semanticRole).toBeUndefined();
      expect(nodes[4].attrs?.indent).toBe(true);
      expect(result.nodesReverted).toBe(4);
    });
  });
});
