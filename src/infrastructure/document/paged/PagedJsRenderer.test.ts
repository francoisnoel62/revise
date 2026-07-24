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
      // Match the wrapper markup precisely: the CSS carries a `.body-matter` selector comment,
      // so a bare 'body-matter' substring is present in every document via the <style> block.
      expect(html).not.toContain('class="body-matter"');
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

    it('applies the classique design class to the nav element by default', () => {
      const html = renderer.render({
        bodyHtml: '<section id="ch-0" class="chapter"><h1>Ch 1</h1></section>',
        profile,
        assetBaseUrl,
        toc: [{ title: 'Chapitre Un', chapterId: 'ch-0' }],
      });
      expect(html).toMatch(/<nav[^>]*class="[^"]*toc--classique/);
    });

    it('applies the requested tocStyle design class to the nav element', () => {
      const html = renderer.render({
        bodyHtml: '<section id="ch-0" class="chapter"><h1>Ch 1</h1></section>',
        profile,
        assetBaseUrl,
        toc: [{ title: 'Chapitre Un', chapterId: 'ch-0' }],
        tocStyle: 'litteraire',
      });
      expect(html).toMatch(/<nav[^>]*class="[^"]*toc--litteraire/);
    });
  });

  describe('startPageNumber', () => {
    it('emits counter-reset CSS when startPageNumber is greater than 1', () => {
      const html = renderer.render({ bodyHtml: '<p>Texte</p>', profile, assetBaseUrl, startPageNumber: 42 });
      expect(html).toContain('counter-reset: page 41');
    });

    it('does not emit counter-reset when startPageNumber is 1', () => {
      const html = renderer.render({ bodyHtml: '<p>Texte</p>', profile, assetBaseUrl, startPageNumber: 1 });
      expect(html).not.toContain('counter-reset: page');
    });

    it('does not emit counter-reset when startPageNumber is omitted', () => {
      const html = renderer.render({ bodyHtml: '<p>Texte</p>', profile, assetBaseUrl });
      expect(html).not.toContain('counter-reset: page');
    });
  });

  describe('liminal page numbering (whole book)', () => {
    it('suppresses the Arabic page increment on liminal pages so the first body page reads 1', () => {
      const html = renderer.render({
        bodyHtml: '<section class="chapter"><p>Corps.</p></section>',
        profile,
        assetBaseUrl,
        frontMatter: { title: 'Mon Roman' },
      });
      const liminalBlock = html.slice(html.indexOf('@page liminal-page'));
      expect(liminalBlock).toContain('counter-increment: page 0');
    });

    it('numbers liminaires with an upper-roman folio counter', () => {
      const html = renderer.render({
        bodyHtml: '<section class="chapter"><p>Corps.</p></section>',
        profile,
        assetBaseUrl,
        frontMatter: { title: 'Mon Roman' },
      });
      expect(html).toContain('content: counter(folio, upper-roman)');
    });
  });

  describe('sourceId', () => {
    it('includes sourceId in the paged-rendered postMessage when provided', () => {
      const html = renderer.render({
        bodyHtml: '<p>A</p>',
        profile,
        assetBaseUrl,
        sourceId: 'background-ch3',
      });
      expect(html).toContain('"background-ch3"');
    });

    it('includes null as sourceId when not provided', () => {
      const html = renderer.render({ bodyHtml: '<p>A</p>', profile, assetBaseUrl });
      expect(html).toContain('sourceId:null');
    });
  });

  describe('chapter navigation', () => {
    it('includes a message listener for navigate-to-chapter events', () => {
      const html = renderer.render({ bodyHtml: '<p>A</p>', profile, assetBaseUrl });
      expect(html).toContain('navigate-to-chapter');
    });

    it('walks up to the pagedjs_page ancestor before scrolling', () => {
      const html = renderer.render({ bodyHtml: '<p>A</p>', profile, assetBaseUrl });
      // The handler must climb to .pagedjs_page, not call scrollIntoView on the
      // original section element (which sits inside a clipped page box after Paged.js renders)
      expect(html).toContain('pagedjs_page');
      expect(html).toContain('parentElement');
      expect(html).toContain('scrollIntoView');
    });

    it('includes a message listener for sync-scroll events that sets scrollTop proportionally', () => {
      const html = renderer.render({ bodyHtml: '<p>A</p>', profile, assetBaseUrl });
      expect(html).toContain('sync-scroll');
      expect(html).toContain('scrollTop');
    });

    it('resolves sync-scroll segments against data-word-anchor elements instead of a single global ratio', () => {
      const html = renderer.render({ bodyHtml: '<p>A</p>', profile, assetBaseUrl });
      expect(html).toContain('data-word-anchor');
      expect(html).toContain('segmentIndex');
      expect(html).toContain('localRatio');
    });
  });

  describe('visible page numbers', () => {
    it('prints an Arabic page number on body pages, distinct from the liminal roman-numeral rule', () => {
      const html = renderer.render({ bodyHtml: '<p>Texte</p>', profile, assetBaseUrl });
      // Everything up to the liminal @page rule is the main @page block: it must
      // already declare a visible counter(page), not just the roman-numeral one
      // scoped to liminal pages.
      const mainPageBlock = html.slice(html.indexOf('@page {'), html.indexOf('@page liminal-page'));
      expect(mainPageBlock).toContain('@bottom-center');
      expect(mainPageBlock).toContain('content: counter(page)');
    });

    it('keeps the visible page number alongside the counter-reset offset', () => {
      const html = renderer.render({ bodyHtml: '<p>Texte</p>', profile, assetBaseUrl, startPageNumber: 42 });
      expect(html).toContain('counter-reset: page 41');
      const mainPageBlock = html.slice(html.indexOf('@page {'), html.indexOf('@page liminal-page'));
      expect(mainPageBlock).toContain('content: counter(page)');
    });
  });

  describe('endnote reading bubble', () => {
    it('creates a single shared bubble element appended to the document', () => {
      const html = renderer.render({ bodyHtml: '<p>A</p>', profile, assetBaseUrl });
      expect(html).toContain("id='endnote-bubble'");
    });

    it('wires hover, focus and click on endnote calls to fill and toggle the bubble', () => {
      const html = renderer.render({ bodyHtml: '<p>A</p>', profile, assetBaseUrl });
      // reads the note body carried in the call and drives the shared bubble
      expect(html).toContain('endnote-ref');
      expect(html).toContain('endnote-body');
      expect(html).toContain("data-visible");
      // both hover and click open it
      expect(html).toMatch(/pointerover|mouseover/);
      expect(html).toContain('click');
    });

    it('dismisses the bubble on outside click and on Escape without trapping focus', () => {
      const html = renderer.render({ bodyHtml: '<p>A</p>', profile, assetBaseUrl });
      expect(html).toContain('Escape');
    });

    it('does not let hover override a click-pinned note (the pin wins until dismissed)', () => {
      const html = renderer.render({ bodyHtml: '<p>A</p>', profile, assetBaseUrl });
      // the pointerover handler must guard on the pinned state, or hovering another
      // call would swap the bubble out from under a pinned note and leave it stuck
      expect(html).toMatch(/pointerover[\s\S]{0,160}!pinned/);
    });

    it('defers wiring until a paginated page exists (listeners set before Paged.js finishes never fire)', () => {
      const html = renderer.render({ bodyHtml: '<p>A</p>', profile, assetBaseUrl });
      // The bubble setup lives in an init() gated on .pagedjs_page — either it already
      // exists or a MutationObserver waits for it. Wiring at parse time would leave the
      // handlers bound before Paged.js rebuilds the preview DOM, so hover would do nothing.
      expect(html).toMatch(/function init\(\)/);
      expect(html).toMatch(/querySelector\('\.pagedjs_page'\)[\s\S]{0,40}init\(\)/);
      expect(html).toContain('MutationObserver');
    });
  });

  describe('endnote compilation (back matter)', () => {
    const note = (text: string) => ({
      type: 'doc' as const,
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    });
    const chapterContent = (text: string) => ({
      type: 'doc' as const,
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Corps' }, { type: 'endnoteRef', attrs: { content: note(text) } }] },
      ],
    });

    it('compiles a notes section after the body when endnotes are provided', () => {
      const html = renderer.render({
        bodyHtml: '<section id="chapter-ch1" class="chapter"><p>Corps<sup>1</sup></p></section>',
        profile,
        assetBaseUrl,
        frontMatter: { title: 'Mon Roman' },
        endnotes: {
          title: 'Notes',
          chapters: [{ anchorId: 'chapter-ch1', title: 'Ouverture', content: chapterContent('La note'), index: 1 }],
        },
      });
      expect(html).toContain('class="back-matter endnotes"');
      expect(html).toContain('<h3 class="endnotes-chapter-title">Ouverture</h3>');
      // round-trip: the note links back to its body call
      expect(html).toContain('id="endnote-note-chapter-ch1-1"');
      expect(html).toContain('href="#endnote-call-chapter-ch1-1"');
    });

    it('places the notes section after the body matter', () => {
      const html = renderer.render({
        bodyHtml: '<section id="chapter-ch1" class="chapter"><p>Corps texte unique</p></section>',
        profile,
        assetBaseUrl,
        frontMatter: { title: 'Mon Roman' },
        endnotes: {
          title: 'Notes',
          chapters: [{ anchorId: 'chapter-ch1', title: 'Ouverture', content: chapterContent('La note'), index: 1 }],
        },
      });
      const bodyIdx = html.indexOf('Corps texte unique');
      const notesIdx = html.indexOf('class="back-matter endnotes"');
      expect(bodyIdx).toBeGreaterThanOrEqual(0);
      expect(notesIdx).toBeGreaterThan(bodyIdx);
    });

    it('omits the notes section when no endnotes are provided', () => {
      const html = renderer.render({ bodyHtml: '<p>Texte</p>', profile, assetBaseUrl });
      expect(html).not.toContain('class="back-matter endnotes"');
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
      // Anchor on strings unique to the rendered CONTENT, never to the CSS in <head>:
      // 'half-title', 'Chapitre' and 'body-matter' all also occur in style comments/selectors,
      // so indexOf() would match the <head> and mis-order the assertions.
      const halfTitleIdx = html.indexOf('Mon Roman'); // book title, front matter only
      const tocIdx = html.indexOf('Table des matières'); // TOC <h2> only
      const bodyIdx = html.indexOf('id="ch-0"'); // body chapter section only (TOC uses href="#ch-0")

      // front matter comes before TOC
      expect(halfTitleIdx).toBeLessThan(tocIdx);
      // TOC comes before body
      expect(tocIdx).toBeLessThan(bodyIdx);
    });
  });
});
