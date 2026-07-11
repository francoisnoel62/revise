// ABOUTME: Tests for FrontMatterHtmlBuilder — verifies front matter pages are generated
// ABOUTME: correctly from fixture data, in canonical order, with proper HTML structure.
// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { FrontMatterHtmlBuilder } from './FrontMatterHtmlBuilder';
import { TipTapToBookHtml } from './TipTapToBookHtml';
import type { FrontMatterData } from '@/domain/interfaces/DocumentExporter';

const builder = new FrontMatterHtmlBuilder(new TipTapToBookHtml());

function tiptapDoc(...paragraphs: string[]): string {
  return JSON.stringify({
    type: 'doc',
    content: paragraphs.map((text) => ({
      type: 'paragraph',
      content: [{ type: 'text', text }],
    })),
  });
}

describe('FrontMatterHtmlBuilder', () => {
  describe('half-title page', () => {
    it('includes half-title section with the book title', () => {
      const html = builder.build({ title: 'Mon Roman' });
      expect(html).toContain('half-title');
      expect(html).toContain('Mon Roman');
    });

    it('escapes HTML special characters in the title', () => {
      const html = builder.build({ title: '<Mon> "Roman" & Suite' });
      expect(html).not.toContain('<Mon>');
      expect(html).toContain('&lt;Mon&gt;');
      expect(html).toContain('&quot;Roman&quot;');
      expect(html).toContain('&amp;');
    });
  });

  describe('title page', () => {
    it('includes title-page section with title', () => {
      const html = builder.build({ title: 'Mon Roman' });
      expect(html).toContain('title-page');
      expect(html).toContain('Mon Roman');
    });

    it('includes subtitle on title page when provided', () => {
      const html = builder.build({ title: 'Mon Roman', subtitle: 'Un sous-titre' });
      expect(html).toContain('Un sous-titre');
    });

    it('includes author name on title page when provided', () => {
      const html = builder.build({ title: 'Mon Roman', authorName: 'François Noel' });
      expect(html).toContain('François Noel');
    });

    it('does not include subtitle element when subtitle is not provided', () => {
      const html = builder.build({ title: 'Mon Roman' });
      expect(html).not.toContain('book-subtitle');
    });
  });

  describe('copyright page (systematic auto ©)', () => {
    it('always includes a copyright-page section', () => {
      const html = builder.build({ title: 'Mon Roman' });
      expect(html).toContain('copyright-page');
    });

    it('generates the © notice from year and author', () => {
      const html = builder.build({ title: 'Mon Roman', authorName: 'F. Noel', copyrightYear: 2024 });
      expect(html).toContain('© 2024 F. Noel. Tous droits réservés.');
    });

    it('never carries an ISBN — that moved to the legal notice in back matter', () => {
      const html = builder.build({ title: 'Mon Roman', authorName: 'F. Noel', copyrightYear: 2024 });
      expect(html).not.toContain('book-isbn');
    });
  });

  describe('custom front annexes', () => {
    it('renders a front annex as a liminal page with its title and text', () => {
      const html = builder.build({
        title: 'Mon Roman',
        customAnnexes: [{ title: 'Note liminaire', content: tiptapDoc('Un mot avant de commencer.') }],
      });
      expect(html).toContain('annex-page');
      expect(html).toContain('Note liminaire');
      expect(html).toContain('Un mot avant de commencer.');
      expect(html).not.toContain('"type":"doc"');
    });

    it('omits a front annex whose content is empty', () => {
      const emptyDoc = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] });
      const html = builder.build({
        title: 'Mon Roman',
        customAnnexes: [{ title: 'Vide', content: emptyDoc }],
      });
      expect(html).not.toContain('annex-page');
    });
  });

  describe('dedication page', () => {
    it('includes dedication-page when dedicationContent is provided', () => {
      const html = builder.build({ title: 'Mon Roman', dedicationContent: 'À ma famille...' });
      expect(html).toContain('dedication-page');
      expect(html).toContain('À ma famille...');
    });

    it('omits dedication-page when dedicationContent is not provided', () => {
      const html = builder.build({ title: 'Mon Roman' });
      expect(html).not.toContain('dedication-page');
    });

    it('omits dedication-page when dedicationContent is empty string', () => {
      const html = builder.build({ title: 'Mon Roman', dedicationContent: '' });
      expect(html).not.toContain('dedication-page');
    });
  });

  describe('epigraph page', () => {
    it('includes epigraph-page when epigraphContent is provided', () => {
      const html = builder.build({ title: 'Mon Roman', epigraphContent: '« Une citation. »' });
      expect(html).toContain('epigraph-page');
      expect(html).toContain('« Une citation. »');
    });

    it('omits epigraph-page when epigraphContent is not provided', () => {
      const html = builder.build({ title: 'Mon Roman' });
      expect(html).not.toContain('epigraph-page');
    });

    it('omits epigraph-page when epigraphContent is empty string', () => {
      const html = builder.build({ title: 'Mon Roman', epigraphContent: '' });
      expect(html).not.toContain('epigraph-page');
    });
  });

  describe('TipTap JSON content (dédicace / épigraphe stored as doc JSON)', () => {
    it('renders a dedication doc as formatted text, never as raw JSON', () => {
      const html = builder.build({
        title: 'Mon Roman',
        dedicationContent: tiptapDoc('une dédicace'),
      });
      expect(html).toContain('dedication-page');
      expect(html).toMatch(/<p[^>]*>une dédicace<\/p>/);
      expect(html).toContain('class="dedication-text"');
      expect(html).not.toContain('paragraph');
    });

    it('renders an epigraph doc as a quote plus its last paragraph as the attribution', () => {
      const html = builder.build({
        title: 'Mon Roman',
        epigraphContent: tiptapDoc(
          'Pourquoi l’amour et la souffrance vivent-ils ensemble ? Parce que c’est un couple.',
          'Michel Conte',
        ),
      });
      expect(html).toContain('epigraph-page');
      expect(html).toMatch(/<blockquote[^>]*class="epigraph-text"[^>]*>[\s\S]*Parce que[\s\S]*<\/blockquote>/);
      expect(html).toMatch(/class="epigraph-attribution"[^>]*>[\s\S]*Michel Conte/);
      expect(html).not.toContain('paragraph');
    });

    it('renders a single-paragraph epigraph as a quote with no attribution', () => {
      const html = builder.build({
        title: 'Mon Roman',
        epigraphContent: tiptapDoc('Une seule ligne, sans auteur.'),
      });
      expect(html).toContain('Une seule ligne, sans auteur.');
      expect(html).not.toContain('epigraph-attribution');
    });

    it('omits the dedication page when the doc carries no text', () => {
      const emptyDoc = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] });
      const html = builder.build({ title: 'Mon Roman', dedicationContent: emptyDoc });
      expect(html).not.toContain('dedication-page');
    });

    it('still renders legacy plain-text dedication content', () => {
      const html = builder.build({ title: 'Mon Roman', dedicationContent: 'À ma famille.' });
      expect(html).toContain('dedication-page');
      expect(html).toContain('À ma famille.');
    });
  });

  describe('canonical page order', () => {
    it('pages appear in order: half-title → title-page → copyright → dedication → epigraph', () => {
      const data: FrontMatterData = {
        title: 'Mon Roman',
        authorName: 'Auteur Test',
        dedicationContent: 'À toi',
        epigraphContent: '« Une belle citation. »',
      };
      const html = builder.build(data);

      const halfTitleIdx = html.indexOf('half-title');
      const titlePageIdx = html.indexOf('title-page');
      const copyrightIdx = html.indexOf('copyright-page');
      const dedicationIdx = html.indexOf('dedication-page');
      const epigraphIdx = html.indexOf('epigraph-page');

      expect(halfTitleIdx).toBeGreaterThanOrEqual(0);
      expect(titlePageIdx).toBeGreaterThan(halfTitleIdx);
      expect(copyrightIdx).toBeGreaterThan(titlePageIdx);
      expect(dedicationIdx).toBeGreaterThan(copyrightIdx);
      expect(epigraphIdx).toBeGreaterThan(dedicationIdx);
    });
  });

  describe('HTML structure', () => {
    it('wraps each page in a section with class liminal', () => {
      const html = builder.build({ title: 'Mon Roman' });
      expect(html).toMatch(/<section[^>]*class="[^"]*liminal/);
    });
  });
});
