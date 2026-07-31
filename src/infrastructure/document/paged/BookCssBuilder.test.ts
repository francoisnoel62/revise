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

  describe('endnote call + reading bubble', () => {
    const css = new BookCssBuilder().build(PublicationProfile.kdpSixByNine(), 'http://localhost:3000');

    it('numbers endnote calls with a per-document CSS counter', () => {
      expect(css).toMatch(/counter-reset:[^;]*\bendnote\b/);
      expect(css).toMatch(/\.endnote-ref\s*\{[^}]*counter-increment:\s*endnote/);
      expect(css).toMatch(/\.endnote-ref::after\s*\{[^}]*content:\s*counter\(endnote\)/);
    });

    it('renders the call as a raised superscript', () => {
      expect(css).toMatch(/\.endnote-ref\s*\{[^}]*vertical-align:\s*super/);
    });

    it('colours the call like the body text (black), not a distinct link colour', () => {
      expect(css).toMatch(/\.endnote-ref\s*\{[^}]*color:\s*inherit/);
      expect(css).not.toMatch(/\.endnote-ref\s*\{[^}]*color:\s*#1d4ed8/);
    });

    it('keeps the note body out of the flow (revealed only in the floating bubble)', () => {
      expect(css).toMatch(/\.endnote-body\s*\{[^}]*display:\s*none/);
    });

    it('styles a floating, initially hidden bubble anchored to the viewport', () => {
      expect(css).toMatch(/#endnote-bubble\s*\{[^}]*position:\s*fixed/);
      expect(css).toMatch(/#endnote-bubble\s*\{[^}]*display:\s*none/);
      expect(css).toMatch(/#endnote-bubble\[data-visible="true"\]\s*\{[^}]*display:\s*block/);
    });
  });

  describe('compiled endnotes section (export)', () => {
    const css = new BookCssBuilder().build(PublicationProfile.kdpSixByNine(), 'http://localhost:3000');

    it('suppresses the CSS counter for anchored calls (their number is printed literally)', () => {
      expect(css).toMatch(/\.endnote-ref--linked::after\s*\{[^}]*content:\s*none/);
      expect(css).toMatch(/\.endnote-ref--linked\s*\{[^}]*counter-increment:\s*none/);
    });

    it('reduces the notes body size and applies a hanging indent', () => {
      expect(css).toMatch(/\.endnotes-list\s*\{[^}]*font-size:\s*0?\.\d+em/);
      expect(css).toMatch(/\.endnote-item\s*\{[^}]*text-indent:\s*-/);
      expect(css).toMatch(/\.endnote-item\s*\{[^}]*padding-left:/);
    });

    it('renders the inline note body paragraph on the same line as its number', () => {
      expect(css).toMatch(/\.endnote-item\s+p\s*\{[^}]*display:\s*inline/);
    });

    it('breaks the notes section onto its own page like other back matter', () => {
      expect(css).toMatch(/\.back-matter\s*\{[^}]*break-before:\s*page/);
    });
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
    it('leaves visible folios to the renderer after it knows each physical page', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000',
      );
      expect(css).not.toContain('counter-increment: page 0');
      expect(css).not.toContain('content: counter(page)');
      expect(css).not.toContain('counter(folio, upper-roman)');
    });

    it('keeps the half-title and named liminal margin boxes empty before folios are resolved', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000',
      );
      const liminalBlock = css.slice(css.indexOf('@page liminal-page'));
      expect(liminalBlock).toContain('content: none');
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
      expect(halfTitleBlock).toContain('content: none');
    });

    it('keeps forced blank (verso) pages visibly unnumbered without changing physical counting', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000',
      );
      const blankBlock = css.slice(css.indexOf('@page :blank'));
      expect(css).toContain('@page :blank');
      expect(blankBlock.slice(0, blankBlock.indexOf('}', blankBlock.indexOf('@bottom-center')) + 1))
        .toContain('content: none');
    });
  });

  describe('visible page number on body pages', () => {
    it('reserves the bottom-center margin box for the renderer-resolved folio', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );
      const mainPageBlock = css.slice(0, css.indexOf('@page liminal-page'));
      expect(mainPageBlock).toContain('@bottom-center');
      expect(mainPageBlock).toContain('content: none');
    });

    it('does not hard-code either Arabic or Roman counters in the main page rule', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );
      const mainPageBlock = css.slice(0, css.indexOf('@page liminal-page'));
      expect(mainPageBlock).not.toContain('-roman');
      expect(mainPageBlock).not.toContain('counter(page)');
    });

    it('reserves the visible page-number slot for every profile, not just KDP 6×9', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.passerelle(),
        'http://localhost:3000'
      );
      const mainPageBlock = css.slice(0, css.indexOf('@page liminal-page'));
      expect(mainPageBlock).toContain('content: none');
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

    it('re-indents the first body paragraph after a heading when the author opts in with data-indent', () => {
      // The adjacent-sibling rule strips the indent off the first paragraph after a
      // heading (typographic convention). An author who explicitly asks for an indent on
      // that paragraph (data-indent) must win over the convention, restoring the pre-commit
      // behaviour that used to rely on inserting a blank line.
      expect(css).toMatch(
        /\[data-semantic-role="titre-de-chapitre"\] \+ \[data-semantic-role="corps"\]\[data-indent="true"\],\s*\[data-semantic-role="sous-titre"\] \+ \[data-semantic-role="corps"\]\[data-indent="true"\]\s*\{\s*text-indent:\s*0\.8cm/,
      );
    });

    it('aligns the dedication and epigraph to the right of the page', () => {
      expect(css).toMatch(/\.dedication-page,\s*\.epigraph-page\s*\{[^}]*text-align:\s*right/);
      expect(css).toMatch(/\.dedication-page,\s*\.epigraph-page\s*\{[^}]*align-items:\s*flex-end/);
    });

    it('sets the epigraph quote in italic but keeps the dedication in body typography', () => {
      expect(css).toMatch(/\.epigraph-text\s*\{[^}]*font-style:\s*italic/);
      expect(css).not.toMatch(/\.dedication-text\s*\{[^}]*italic/);
    });

    it('centers the legal notice paragraphs, overriding the global justified body text', () => {
      // .colophon centers the section itself, but `p { text-align: justify }` targets
      // paragraphs directly and wins over the inherited center — an explicit override
      // on the legal notice paragraphs is required.
      expect(css).toMatch(/\.legal-notice-text p\s*\{[^}]*text-align:\s*center/);
    });
  });

  describe('liminal (front matter) page rules', () => {
    it('assigns liminal sections to a named page; the renderer writes their Roman folios', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );
      expect(css).toContain('page: liminal-page');
      expect(css).not.toContain('upper-roman');
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

    // Opening the body on a recto is done at the .body-matter wrapper, not the first chapter.
    // When front matter exists the wrapper carries break-before: right and the first chapter
    // waives its own break (.body-matter > .chapter:first-child { break-before: auto }), so only
    // ONE recto is forced. The renderer later derives Arabic folios from the resulting physical
    // page boxes, so this inserted verso remains blank but is still counted before chapter 2.
    it('forces the body onto a recto at the .body-matter wrapper, waiving the first chapter break', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );
      expect(css).toMatch(/\.body-matter\s*\{[^}]*break-before:\s*right/);
      expect(css).toMatch(/\.body-matter\s*>\s*\.chapter:first-child\s*\{[^}]*break-before:\s*auto/);
    });

    // The bare first-child break exception stays scoped to a truly first chapter (direct child of
    // main.book, i.e. no front matter at all). Only the two documented selectors —
    // main.book > .chapter:first-child and .body-matter > .chapter:first-child — may waive it.
    it('only waives the chapter page-break for the two scoped first-child selectors', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );
      expect(css).toMatch(/main\.book\s*>\s*\.chapter:first-child\s*\{[^}]*break-before:\s*auto/);
      // No unscoped `.chapter:first-child { break-before: auto }` (one preceded by whitespace and
      // a non-'>' char, i.e. neither of the two `X > .chapter:first-child` combinators).
      expect(css).not.toMatch(/[^>]\s\.chapter:first-child\s*\{[^}]*break-before:\s*auto/);
    });

    it('includes toc entry leader dots and a renderer-populated page-number slot via CSS', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );
      expect(css).toContain('attr(data-resolved-page)');
    });

    // Publishing convention: every front-matter page (half-title, title, copyright, dedication,
    // epigraph, custom annexes, TOC) opens on a recto (right-hand) page. The base .liminal rule
    // carries break-before: right, so Paged.js inserts a blank verso before any liminaire that
    // would otherwise land on a verso — no per-section override needed.
    it('starts every liminaire (front matter) on a recto (right) page', () => {
      const css = new BookCssBuilder().build(
        PublicationProfile.kdpSixByNine(),
        'http://localhost:3000'
      );
      expect(css).toMatch(/\.liminal\s*\{[^}]*break-before:\s*right/);
    });
  });

  describe('toc design variants (3 presets, always emitted statically)', () => {
    const css = new BookCssBuilder().build(PublicationProfile.kdpSixByNine(), 'http://localhost:3000');

    // Paged.js has no runtime handler for CSS leader(). The dotted fill is reproduced instead
    // with a real .toc-leader element carrying a dotted bottom border, while the renderer writes
    // each physical target page into data-resolved-page after pagination.
    it('classique (default): page numbers via data-resolved-page, no leader() anywhere', () => {
      expect(css).toMatch(/\.toc a::after\s*\{[^}]*data-resolved-page/);
      expect(css).not.toContain("leader(");
    });

    it('classique: fills the gap with a flex-stretched dotted border, not a literal dot string', () => {
      // A dotted bottom border on a flex:1 element occupies exactly the free space on one line;
      // a fixed-length string of dots (the old approach) overflowed onto extra lines.
      expect(css).toMatch(/\.toc--classique \.toc-leader\s*\{[^}]*border-bottom:[^}]*dotted/);
      expect(css).toMatch(/\.toc-leader\s*\{[^}]*flex:\s*1/);
      // No literal repeated-dot content anywhere in the TOC anymore.
      expect(css).not.toMatch(/\.toc[^{]*::after\s*\{[^}]*content:\s*'[^']*\.\s*\.[^']*'/);
    });

    it('classique: distinguishes chapters (bold) from sub-titles (smaller, muted) without a divergent texture', () => {
      // Hierarchy comes from weight + size + colour only, so classique keeps the same
      // typographic texture (font, casing, tracking) as epure/litteraire — no small-caps or
      // letter-spacing that would set it visually apart from the other presets.
      expect(css).toMatch(/\.toc--classique \.toc-chapter > a \.toc-title\s*\{[^}]*font-weight:/);
      expect(css).toMatch(/\.toc-subtitle[^{]*\{[^}]*font-size:/);
      expect(css).not.toContain('small-caps');
      expect(css).not.toContain('letter-spacing');
    });

    it('classique: shows the chapter title verbatim, without generated numbering', () => {
      // Adding a counter-based numeral would double up on titles that already carry their own
      // number ("Chapitre 1", "I. L'aube"), overriding the author's text.
      expect(css).not.toMatch(/\.toc-chapter[^{]*::before/);
      expect(css).not.toMatch(/\.toc-chapter[^{]*\{[^}]*counter-increment/);
    });

    it('classique: adds breathing room above each chapter entry', () => {
      expect(css).toMatch(/\.toc-chapter\s*\{[^}]*margin-top:/);
    });

    it('all three presets share the body font — no toc--* rule overrides font-family', () => {
      // Hierarchy and personality come from leader, numbering, centering and weight — never
      // from a different typeface. A font-family on any toc--* selector would make one preset
      // read as a foreign design; the TOC must inherit the book's body font like the text.
      expect(css).not.toMatch(/\.toc--[a-z]+[^{]*\{[^}]*font-family/);
    });

    it('epure: page numbers without any dotted-fill element', () => {
      expect(css).toMatch(/\.toc a::after\s*\{[^}]*data-resolved-page/);
      expect(css).not.toMatch(/\.toc--epure[^{]*\.toc-title::after/);
    });

    it('litteraire: no page numbers, titles centered', () => {
      expect(css).toMatch(/\.toc--litteraire a::after\s*\{[^}]*content:\s*none/);
      expect(css).toMatch(/\.toc--litteraire a\s*\{[^}]*justify-content:\s*center/);
    });

    it('litteraire: hides the leader so centered titles are not pushed off-centre', () => {
      expect(css).toMatch(/\.toc--litteraire \.toc-leader\s*\{[^}]*display:\s*none/);
    });

    // The TOC is .liminal for numbering, but a multi-page flowing list — unlike the single
    // centered front-matter pages. It must start each page at the top; otherwise the last
    // (short) page's entries float in the vertical middle.
    it('does not vertically centre the (multi-page) TOC the way single liminal pages are', () => {
      expect(css).toMatch(/\.toc\s*\{[^}]*justify-content:\s*flex-start/);
      expect(css).toMatch(/\.toc\s*\{[^}]*min-height:\s*0/);
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

    // The renderer fills data-resolved-page after pagination. A shrink-to-fit number box would
    // settle at a different width per row (1 vs 2 vs 3 digits), so a fixed min-width and right
    // alignment keep all resolved values in a stable column.
    it('gives the page-number box a fixed width and right alignment', () => {
      expect(css).toMatch(/\.toc a::after\s*\{[^}]*min-width:/);
      expect(css).toMatch(/\.toc a::after\s*\{[^}]*text-align:\s*right/);
    });

    it('aligns title and page number on a shared baseline', () => {
      expect(css).toMatch(/\.toc a\s*\{[^}]*align-items:\s*baseline/);
    });
  });
});
