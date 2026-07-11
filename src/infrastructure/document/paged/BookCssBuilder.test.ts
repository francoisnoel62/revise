// ABOUTME: Tests profile-driven CSS emitted for paged preview and export.
// ABOUTME: Ensures font embedding and page geometry match each profile's declaration.

import { describe, expect, it } from 'vitest';
import { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import { LevelStyleSet } from '@/domain/value-objects/LevelStyleSet';
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

  describe('liminal page numbering (whole book)', () => {
    it('suppresses the Arabic page increment on liminal pages so the first body page reads 1', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000',
      );
      // Zeroing the page increment on liminal pages (rather than a non-persistent
      // mid-document counter-reset) leaves the first body page at Arabic 1.
      const liminalBlock = css.slice(css.indexOf('@page liminal-page'));
      expect(liminalBlock).toContain('counter-increment: page 0');
    });

    it('numbers liminaires with a seeded lower-roman folio counter', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000',
      );
      expect(css).toContain('counter-reset: folio 1');
      expect(css).toContain('counter-increment: folio 1');
      const liminalBlock = css.slice(css.indexOf('@page liminal-page'));
      expect(liminalBlock).toContain('content: counter(folio, lower-roman)');
    });

    it('leaves the half-title (first liminal page) without a printed number', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000',
      );
      expect(css).toContain('page: half-title-page');
      const halfTitleBlock = css.slice(
        css.indexOf('@page half-title-page'),
        css.indexOf('@page liminal-page'),
      );
      expect(halfTitleBlock).toContain('counter-increment: page 0');
      expect(halfTitleBlock).toContain('content: none');
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

    function selectorBlock(css: string, selector: string): string {
      for (const block of css.split('}')) {
        const braceIndex = block.indexOf('{');
        if (braceIndex === -1) continue;
        if (block.slice(0, braceIndex).trim() === selector) return block.slice(braceIndex + 1);
      }
      throw new Error(`No block declared for selector "${selector}"`);
    }

    it('renders semantic subtitles smaller than semantic chapter titles', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );

      expect(selectorFontSizePt(css, '[data-semantic-role="sous-titre"]')).toBeLessThan(
        selectorFontSizePt(css, '[data-semantic-role="titre-de-chapitre"]'),
      );
    });

    it('keeps the current 14pt/12pt/body-profile defaults without raw heading typography', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000',
      );

      expect(selectorFontSizePt(css, '[data-semantic-role="titre-de-chapitre"]')).toBe(14);
      expect(selectorFontSizePt(css, '[data-semantic-role="sous-titre"]')).toBe(12);
      expect(selectorFontSizePt(css, '[data-semantic-role="corps"]')).toBe(11);
      expect(() => selectorFontSizePt(css, 'h1')).toThrow('No font-size declared');
      expect(() => selectorFontSizePt(css, 'h2')).toThrow('No font-size declared');
    });

    it('emits every customized attribute for one semantic role independently', () => {
      const profile = PublicationProfile.kdpSixByNine();
      const defaults = LevelStyleSet.defaultsFor(profile).values;
      const css = new BookCssBuilder().build(profile, 'http://localhost:3000', undefined, {
        ...defaults,
        'sous-titre': {
          fontSizePoints: 18,
          fontWeight: 'normal',
          italic: true,
          alignment: 'right',
          lineHeight: 1.4,
          spaceBeforePoints: 31,
          spaceAfterPoints: 17,
          fontFamily: 'Arial',
        },
      });
      const block = selectorBlock(css, '[data-semantic-role="sous-titre"]');

      expect(block).toContain("font-family: 'Arial', sans-serif");
      expect(block).toContain('font-size: 18pt');
      expect(block).toContain('font-weight: 400');
      expect(block).toContain('font-style: italic');
      expect(block).toContain('text-align: right');
      expect(block).toContain('line-height: 1.4');
      expect(block).toContain('margin-top: 31pt');
      expect(block).toContain('margin-bottom: 17pt');
      expect(selectorFontSizePt(css, '[data-semantic-role="titre-de-chapitre"]')).toBe(14);
    });
  });

  describe('orphan headings, subtitle indent and liminaire styling', () => {
    const css = new BookCssBuilder().build(
      PublicationProfile.kdpSixByNine(),
      'http://localhost:3000',
    );

    it('keeps chapter titles and subtitles from ending a page (break-after: avoid)', () => {
      expect(css).toContain('break-after: avoid');
      expect(css).toMatch(
        /titre-de-chapitre"\],\s*\[data-semantic-role="sous-titre"\]\s*\{\s*break-after:\s*avoid/,
      );
    });

    it('indents subtitles by the profile first-line indent to align with body starts', () => {
      expect(css).toContain('[data-semantic-role="sous-titre"] { text-indent: 0.8cm; }');
    });

    it('aligns the dedication and epigraph to the right of the page', () => {
      expect(css).toMatch(/\.dedication-page,\s*\.epigraph-page\s*\{[^}]*text-align:\s*right/);
      expect(css).toMatch(/\.dedication-page,\s*\.epigraph-page\s*\{[^}]*align-items:\s*flex-end/);
    });

    it('sets the epigraph quote in italic but keeps the dedication in body typography', () => {
      expect(css).toMatch(/\.epigraph-text\s*\{[^}]*font-style:\s*italic/);
      expect(css).not.toMatch(/\.dedication-text\s*\{[^}]*italic/);
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

    it('styles the liminal titles larger than the body, with no first-line indent', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );
      // The title-page book title carries a dedicated, enlarged font size.
      expect(css).toMatch(/\.book-title\s*\{[^}]*font-size:\s*2\.4em/);
      // Centered liminal titles must cancel the global p { text-indent } so they stay centered.
      expect(css).toMatch(/\.book-title\s*\{[^}]*text-indent:\s*0/);
    });

    it('gives the author name its own emphasized styling on the title page', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );
      expect(css).toMatch(/\.book-author\s*\{[^}]*font-size/);
      expect(css).toMatch(/\.book-author\s*\{[^}]*text-indent:\s*0/);
    });

    it('sizes the liminal box to the printable page height, not the viewport', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );
      // 100vh overshoots the content box (page height minus margins) and pushes the
      // vertically-centered text below the true center; the box must match page geometry.
      expect(css).not.toContain('100vh');
      const liminalBlock = css.slice(css.indexOf('.liminal {'));
      expect(liminalBlock).toMatch(/min-height:\s*calc\(/);
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

  describe('toc design variants (3 presets, always emitted statically)', () => {
    const css = new BookCssBuilder().build(PublicationProfile.kdpSixByNine(), 'http://localhost:3000');

    // Paged.js has no runtime handler for CSS leader() (only target-counter() is implemented
    // by its generated-content module), so a `content: leader('.') target-counter(...)` value
    // is invalid as a whole and silently drops both the dots and the number. The dotted fill
    // is reproduced instead via a real element (.toc-title) with clipped repeated-dot content.
    it('classique (default): page numbers via target-counter, no leader() anywhere', () => {
      expect(css).toMatch(/\.toc a::after\s*\{[^}]*target-counter/);
      expect(css).not.toContain("leader(");
    });

    it('classique: fills the gap with a dotted-fill element, not CSS leader()', () => {
      expect(css).toMatch(/\.toc--classique \.toc-title::after\s*\{[^}]*content:\s*'[^']*\.[^']*'/);
    });

    it('classique: lets long titles wrap instead of clipping them behind the page number', () => {
      // Long sous-titres must break onto a new line rather than be cut off by the
      // fixed-width page-number column; nowrap + overflow:hidden would forbid that.
      expect(css).not.toMatch(/\.toc--classique \.toc-title\s*\{[^}]*white-space:\s*nowrap/);
      expect(css).not.toMatch(/\.toc--classique \.toc-title\s*\{[^}]*overflow:\s*hidden/);
    });

    it('epure: page numbers without any dotted-fill element', () => {
      expect(css).toMatch(/\.toc a::after\s*\{[^}]*target-counter/);
      expect(css).not.toMatch(/\.toc--epure[^{]*\.toc-title::after/);
    });

    it('litteraire: no page numbers, titles centered', () => {
      expect(css).toMatch(/\.toc--litteraire a::after\s*\{[^}]*content:\s*none/);
      expect(css).toMatch(/\.toc--litteraire a\s*\{[^}]*justify-content:\s*center/);
    });

    it('indents nested sub-entries', () => {
      expect(css).toMatch(/\.toc li ol\s*\{/);
    });

    // `.toc ol` caps the top-level list at max-width:80% of the nav. Without an override,
    // that same max-width:80% cascades onto `.toc li ol` too — but relative to the <li>'s own
    // box, which already sits inside the 80%-capped top list. The nested list's right edge
    // then lands at 80% of 80% (64%) instead of the top list's 80%, so sub-entry page numbers
    // stop well short of the column chapter-level numbers land in.
    it('does not let max-width compound on nested sub-entry lists', () => {
      expect(css).toMatch(/\.toc li ol\s*\{[^}]*max-width:\s*none/);
    });
  });

  describe('toc page-number column stability (row-to-row vertical alignment)', () => {
    const css = new BookCssBuilder().build(PublicationProfile.kdpSixByNine(), 'http://localhost:3000');

    // Paged.js resolves each target-counter() in isolation, late in pagination, forcing a
    // reflow of only the matched <a> element. A shrink-to-fit number box therefore settles
    // at a different width/position per row (1 vs 2 vs 3 digits). Giving the box a fixed
    // min-width and right alignment up front keeps its size constant regardless of when or
    // to what value it resolves, so rows line up consistently.
    it('gives the page-number box a fixed width and right alignment', () => {
      expect(css).toMatch(/\.toc a::after\s*\{[^}]*min-width:/);
      expect(css).toMatch(/\.toc a::after\s*\{[^}]*text-align:\s*right/);
    });

    it('aligns title and page number on a shared baseline', () => {
      expect(css).toMatch(/\.toc a\s*\{[^}]*align-items:\s*baseline/);
    });
  });
});
