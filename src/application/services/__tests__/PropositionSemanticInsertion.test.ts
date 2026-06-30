// ABOUTME: Integration tests for proposition insertion in a semantic TipTap document.
// ABOUTME: TDD anchor for issue #135: insertion de proposition → doc sémantique attendu.

import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';
import { IndentParagraph } from '@/components/editor/extensions/IndentParagraph';
import { buildSemanticInsertContent } from '../PropositionInserter';
import type { ContentNode } from '@/domain/value-objects/ContentNode';

function semanticDoc(...nodes: ContentNode[]): ContentNode {
  return { type: 'doc', content: nodes };
}

function corpsParagraph(text: string): ContentNode {
  return {
    type: 'paragraph',
    attrs: { semanticRole: 'corps' },
    content: [{ type: 'text', text }],
  };
}

function createEditor(content: ContentNode) {
  return new Editor({
    extensions: [Document, IndentParagraph, Text],
    content: content as object,
  });
}

describe('proposition insertion → document sémantique attendu', () => {
  let editor: Editor;

  afterEach(() => {
    if (!editor.isDestroyed) editor.destroy();
  });

  describe('single-line proposal into a semantic paragraph', () => {
    it('preserves semanticRole on the host paragraph after inline insertion', () => {
      editor = createEditor(
        semanticDoc(corpsParagraph('Texte original.'))
      );

      const from = 1;
      const to = editor.state.doc.content.size - 1;
      const content = buildSemanticInsertContent('Texte réécrit.', 'corps');

      editor
        .chain()
        .setTextSelection({ from, to })
        .insertContent(content)
        .run();

      const json = editor.getJSON() as ContentNode;
      const para = json.content?.[0];
      expect(para?.attrs?.semanticRole).toBe('corps');
    });

    it('preserves semanticRole when replacing a partial selection within a paragraph', () => {
      editor = createEditor(
        semanticDoc(corpsParagraph('Il était une fois un héros.'))
      );

      // Select "un héros" (approximate positions)
      const docText = editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n');
      expect(docText).toContain('Il était une fois un héros.');

      editor.commands.setTextSelection({ from: 1, to: 15 });
      const content = buildSemanticInsertContent('une héroïne', 'corps');
      editor.commands.insertContent(content);

      const json = editor.getJSON() as ContentNode;
      const para = json.content?.[0];
      expect(para?.attrs?.semanticRole).toBe('corps');
    });
  });

  describe('multi-paragraph proposal replacing a selection', () => {
    it('creates semantic paragraphs with semanticRole on each new node', () => {
      editor = createEditor(
        semanticDoc(
          corpsParagraph('Premier paragraphe original.'),
          corpsParagraph('Deuxième paragraphe original.')
        )
      );

      const from = 1;
      const to = editor.state.doc.content.size - 1;
      const content = buildSemanticInsertContent(
        'Nouvelle version A.\n\nNouvelle version B.',
        'corps'
      );

      editor
        .chain()
        .setTextSelection({ from, to })
        .insertContent(content)
        .run();

      const json = editor.getJSON() as ContentNode;
      const paragraphs = json.content ?? [];
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
      for (const para of paragraphs) {
        if (para.type === 'paragraph') {
          expect(para.attrs?.semanticRole).toBe('corps');
        }
      }
    });
  });

  describe('selection stability across page boundaries', () => {
    it('textBetween correctly extracts text that would span two pages', () => {
      // Create a document with enough content to span 2 pages (~500 words)
      const para1 = corpsParagraph(
        'La vieille maison se dressait au bord du chemin, silhouette sombre contre le ciel crépusculaire.'
      );
      const para2 = corpsParagraph(
        'Les fenêtres, sans lumière depuis des années, regardaient le visiteur avec une fixité inquiétante.'
      );
      const para3 = corpsParagraph(
        'Il s\'approcha lentement, le cœur battant, conscient que chaque pas le rapprochait d\'un secret enfoui.'
      );
      const para4 = corpsParagraph(
        'La porte grinca sur ses gonds rouillés quand il la poussa du bout des doigts, comme à regret.'
      );
      const para5 = corpsParagraph(
        'À l\'intérieur, l\'air immobile et poussiéreux avait gardé l\'empreinte des habitants disparus.'
      );

      editor = createEditor(semanticDoc(para1, para2, para3, para4, para5));

      const docSize = editor.state.doc.content.size;
      // Select from start of para1 to end of para5 (would span multiple "pages")
      const from = 1;
      const to = docSize - 1;

      const selectedText = editor.state.doc.textBetween(from, to, ' ');

      // All paragraphs should be included in the selection
      expect(selectedText).toContain('La vieille maison');
      expect(selectedText).toContain('Les fenêtres');
      expect(selectedText).toContain('Il s\'approcha');
      expect(selectedText).toContain('La porte grinca');
      expect(selectedText).toContain('l\'air immobile');
    });

    it('positions remain correct after semantic insertion in a long document', () => {
      const paragraphs = Array.from({ length: 20 }, (_, i) =>
        corpsParagraph(`Paragraphe ${i + 1} avec du contenu substantiel pour remplir l'espace.`)
      );

      editor = createEditor(semanticDoc(...paragraphs));

      // Select paragraphs 5-10 (mid-document, across "page boundaries")
      const doc = editor.state.doc;
      // Find position after 4th paragraph and before 11th
      let charCount = 0;
      let from = 0;
      let to = 0;
      doc.descendants((node, pos) => {
        if (node.type.name === 'paragraph') {
          charCount++;
          if (charCount === 5) from = pos + 1;
          if (charCount === 10) to = pos + node.nodeSize - 1;
        }
      });

      const selectedText = doc.textBetween(from, to, ' ');
      expect(selectedText).toContain('Paragraphe 5');
      expect(selectedText).toContain('Paragraphe 10');
      expect(selectedText).not.toContain('Paragraphe 4');
      expect(selectedText).not.toContain('Paragraphe 11');

      // After inserting a proposition, positions should still be valid
      const content = buildSemanticInsertContent('Contenu de remplacement.', 'corps');
      editor
        .chain()
        .setTextSelection({ from, to })
        .insertContent(content)
        .run();

      // Document should still be valid semantic content
      const json = editor.getJSON() as ContentNode;
      for (const para of json.content ?? []) {
        if (para.type === 'paragraph') {
          expect(para.attrs?.semanticRole).toBe('corps');
        }
      }
    });
  });
});
