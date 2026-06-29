// ABOUTME: Tests for FrontMatterHtmlBuilder — verifies front matter pages are generated
// ABOUTME: correctly from fixture data, in canonical order, with proper HTML structure.
// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { FrontMatterHtmlBuilder } from './FrontMatterHtmlBuilder';
import type { FrontMatterData } from '@/domain/interfaces/DocumentExporter';

const builder = new FrontMatterHtmlBuilder();

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

  describe('copyright page', () => {
    it('includes copyright-page section', () => {
      const html = builder.build({ title: 'Mon Roman' });
      expect(html).toContain('copyright-page');
    });

    it('uses explicit copyright content when provided', () => {
      const html = builder.build({ title: 'Mon Roman', copyrightContent: 'Contenu copyright personnalisé.' });
      expect(html).toContain('Contenu copyright personnalisé.');
    });

    it('generates copyright from year and author when no explicit content', () => {
      const html = builder.build({ title: 'Mon Roman', authorName: 'F. Noel', copyrightYear: 2024 });
      expect(html).toContain('2024');
      expect(html).toContain('F. Noel');
    });

    it('includes ISBN when provided', () => {
      const html = builder.build({ title: 'Mon Roman', isbn: '978-0-000-00000-0' });
      expect(html).toContain('978-0-000-00000-0');
    });

    it('does not include ISBN element when isbn is not provided', () => {
      const html = builder.build({ title: 'Mon Roman' });
      expect(html).not.toContain('book-isbn');
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
