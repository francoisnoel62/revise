// ABOUTME: Tests for PagedJsRenderer — verifies that rendered HTML includes front matter,
// ABOUTME: TOC, and body wrapped in the correct structure for Paged.js.
// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { PagedJsRenderer } from './PagedJsRenderer';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';

const renderer = new PagedJsRenderer();
const profile = PublicationProfile.kdpSixByNine();
const assetBaseUrl = 'http://localhost:3000';

describe('PagedJsRenderer', () => {
  describe('basic render', () => {
    it('returns a complete HTML document', () => {
      const html = renderer.render({ bodyHtml: '<p>Texte</p>', profile, assetBaseUrl });
      expect(html).toContain('<!doctype html>');
      expect(html).toContain('<body>');
      expect(html).toContain('Texte');
    });

    it('includes Paged.js polyfill script', () => {
      const html = renderer.render({ bodyHtml: '<p>A</p>', profile, assetBaseUrl });
      expect(html).toContain('paged.polyfill.min.js');
    });
  });

  describe('front matter integration', () => {
    it('includes front matter HTML before body content when frontMatter is provided', () => {
      const html = renderer.render({
        bodyHtml: '<section class="chapter"><h1>Chapitre 1</h1></section>',
        profile,
        assetBaseUrl,
        frontMatter: { title: 'Mon Roman', authorName: 'Auteur Test' },
      });
      const frontMatterIdx = html.indexOf('half-title');
      const bodyIdx = html.indexOf('Chapitre 1');
      expect(frontMatterIdx).toBeGreaterThanOrEqual(0);
      expect(frontMatterIdx).toBeLessThan(bodyIdx);
    });

    it('wraps body in .body-matter div when front matter is present', () => {
      const html = renderer.render({
        bodyHtml: '<section class="chapter"><p>Corps.</p></section>',
        profile,
        assetBaseUrl,
        frontMatter: { title: 'Mon Roman' },
      });
      expect(html).toContain('class="body-matter"');
    });

    it('does not add .body-matter wrapper when no front matter or TOC', () => {
      const html = renderer.render({
        bodyHtml: '<section class="chapter"><p>Corps.</p></section>',
        profile,
        assetBaseUrl,
      });
      expect(html).not.toContain('body-matter');
    });
  });

  describe('TOC integration', () => {
    it('includes TOC before body content when toc entries are provided', () => {
      const html = renderer.render({
        bodyHtml: '<section id="ch-0" class="chapter"><h1>Ch 1</h1></section>',
        profile,
        assetBaseUrl,
        toc: [{ title: 'Chapitre Un', chapterId: 'ch-0' }],
      });
      const tocIdx = html.indexOf('Table des matières');
      const bodyIdx = html.indexOf('Ch 1');
      expect(tocIdx).toBeGreaterThanOrEqual(0);
      expect(tocIdx).toBeLessThan(bodyIdx);
    });

    it('omits TOC when toc array is empty', () => {
      const html = renderer.render({
        bodyHtml: '<p>Texte</p>',
        profile,
        assetBaseUrl,
        toc: [],
      });
      expect(html).not.toContain('Table des matières');
    });
  });

  describe('render order', () => {
    it('renders: front matter → TOC → body', () => {
      const html = renderer.render({
        bodyHtml: '<section id="ch-0" class="chapter"><h1>Chapitre</h1></section>',
        profile,
        assetBaseUrl,
        frontMatter: { title: 'Mon Roman' },
        toc: [{ title: 'Chapitre', chapterId: 'ch-0' }],
      });
      const halfTitleIdx = html.indexOf('half-title');
      const tocIdx = html.indexOf('Table des matières');
      const bodyIdx = html.indexOf('Chapitre');

      // front matter comes before TOC
      expect(halfTitleIdx).toBeLessThan(tocIdx);
      // TOC comes before body
      expect(tocIdx).toBeLessThan(bodyIdx);
    });
  });
});
