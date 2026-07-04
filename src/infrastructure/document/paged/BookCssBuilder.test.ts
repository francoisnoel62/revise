// ABOUTME: Tests profile-driven CSS emitted for paged preview and export.
// ABOUTME: Ensures font embedding and page geometry match each profile's declaration.

import { describe, expect, it } from 'vitest';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import { BookCssBuilder } from './BookCssBuilder';

describe('BookCssBuilder', () => {
  it('uses the system Arial font for the passerelle profile', () => {
    const css = new BookCssBuilder().build(
      PublicationProfile.passerelle(),
      'http://localhost:3000'
    );

    expect(css).toContain("font-family: 'Arial', sans-serif");
    expect(css).not.toContain("font-family: 'Arial';\n        src:");
  });

  it('embeds EB Garamond for KDP 6×9', () => {
    const css = new BookCssBuilder().build(
      PublicationProfile.kdpSixByNine(),
      'http://localhost:3000'
    );

    expect(css).toContain("font-family: 'EB Garamond'");
    expect(css).toContain('eb-garamond-400.woff2');
    expect(css).toContain('size: 6in 9in');
  });

  it('falls back to KDP 6×9 CSS for a removed profile id', () => {
    const css = new BookCssBuilder().build(
      PublicationProfile.fromId('kdp-5x8' as never),
      'http://localhost:3000'
    );

    expect(css).toContain('eb-garamond-400.woff2');
    expect(css).toContain('size: 6in 9in');
  });

  it('embeds EB Garamond for A5 and emits the correct page size and margins', () => {
    const css = new BookCssBuilder().build(
      PublicationProfile.fromId('a5'),
      'http://localhost:3000'
    );

    expect(css).toContain('eb-garamond-400.woff2');
    expect(css).toContain('size: 5.83in 8.27in');
    expect(css).toContain('margin-top: 1.8cm');
    expect(css).toContain('margin-bottom: 1.8cm');
    expect(css).toContain('margin-left: 2cm');
    expect(css).toContain('margin-right: 1.5cm');
  });

  describe('startPageNumber counter-reset', () => {
    it('emits counter-reset when startPageNumber is greater than 1', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000',
        84,
      );
      expect(css).toContain('counter-reset: page 83');
    });

    it('does not emit counter-reset when startPageNumber is 1', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000',
        1,
      );
      expect(css).not.toContain('counter-reset: page');
    });

    it('does not emit counter-reset when startPageNumber is omitted', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000',
      );
      expect(css).not.toContain('counter-reset: page');
    });
  });

  describe('body-matter Arabic numbering restart (whole book)', () => {
    it('resets the page counter at the body-matter boundary so the first body page is Arabic 1', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000',
        undefined,
        true,
      );
      expect(css).toContain('.body-matter { counter-reset: page 0; }');
    });

    it('omits the body-matter reset for single-chapter preview/export (no liminals)', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000',
      );
      expect(css).not.toContain('.body-matter { counter-reset');
    });
  });

  describe('visible page number on body pages', () => {
    it('declares an @bottom-center rule printing the Arabic page counter on the main @page rule', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );
      const mainPageBlock = css.slice(0, css.indexOf('@page liminal-page'));
      expect(mainPageBlock).toContain('@bottom-center');
      expect(mainPageBlock).toContain('content: counter(page)');
    });

    it('does not use lower-roman numerals for the main page rule (reserved for liminal pages)', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );
      const mainPageBlock = css.slice(0, css.indexOf('@page liminal-page'));
      expect(mainPageBlock).not.toContain('lower-roman');
    });

    it('prints the visible page number for every profile, not just KDP 6×9', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.passerelle(),
        'http://localhost:3000'
      );
      const mainPageBlock = css.slice(0, css.indexOf('@page liminal-page'));
      expect(mainPageBlock).toContain('content: counter(page)');
    });
  });

  describe('heading hierarchy', () => {
    function selectorFontSizePt(css: string, selector: string): number {
      for (const block of css.split('}')) {
        const braceIndex = block.indexOf('{');
        if (braceIndex === -1) continue;
        if (block.slice(0, braceIndex).trim() !== selector) continue;
        const match = block.match(/font-size:\s*([\d.]+)pt/);
        if (match) return Number.parseFloat(match[1]);
      }
      throw new Error(`No font-size declared for selector "${selector}"`);
    }

    it('renders subtitles (h2) smaller than chapter titles (h1)', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );

      expect(selectorFontSizePt(css, 'h2')).toBeLessThan(selectorFontSizePt(css, 'h1'));
    });
  });

  describe('liminal (front matter) page rules', () => {
    it('assigns liminal sections to a named page with roman numerals', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );
      expect(css).toContain('page: liminal-page');
      expect(css).toContain('lower-roman');
    });

    it('makes chapters start on odd (right) pages', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );
      expect(css).toContain('break-before: right');
    });

    it('includes toc entry leader dots via CSS', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );
      expect(css).toContain('target-counter');
    });
  });
});
