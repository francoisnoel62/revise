// ABOUTME: Converts a publication profile into deterministic CSS paged-media rules.
// ABOUTME: Centralizes page geometry and typography so preview and PDF cannot drift.

import type { PublicationProfile } from '@/domain/value-objects/PublicationProfile';
import {
  LEVEL_STYLE_ROLES,
  LevelStyleSet,
  type LevelStyle,
  type LevelStyleSetProperties,
} from '@/domain/value-objects/LevelStyleSet';

function semanticRoleRule(role: string, style: LevelStyle): string {
  const fallback = style.fontFamily === 'EB Garamond' ? 'serif' : 'sans-serif';
  return `
      [data-semantic-role="${role}"] {
        font-family: '${style.fontFamily}', ${fallback};
        font-size: ${style.fontSizePoints}pt;
        font-weight: ${style.fontWeight === 'bold' ? 700 : 400};
        font-style: ${style.italic ? 'italic' : 'normal'};
        text-align: ${style.alignment};
        line-height: ${style.lineHeight};
        margin-top: ${style.spaceBeforePoints}pt;
        margin-bottom: ${style.spaceAfterPoints}pt;
      }`;
}

export class BookCssBuilder {
  build(
    profile: PublicationProfile,
    assetBaseUrl: string,
    startPageNumber?: number,
    levelStyles?: LevelStyleSetProperties,
  ): string {
    const value = profile.values;
    const assets = assetBaseUrl.replace(/\/$/, '');
    const usesEbGaramond = value.bodyFontFamily === 'EB Garamond';
    const embeddedFontFaces = usesEbGaramond
      ? `
      @font-face {
        font-family: '${value.bodyFontFamily}';
        src: url('${assets}/fonts/eb-garamond-400.woff2') format('woff2');
        font-style: normal;
        font-weight: 400;
        font-display: block;
      }
      @font-face {
        font-family: '${value.bodyFontFamily}';
        src: url('${assets}/fonts/eb-garamond-700.woff2') format('woff2');
        font-style: normal;
        font-weight: 700;
        font-display: block;
      }`
      : '';
    const fontFallback = usesEbGaramond ? 'serif' : 'sans-serif';
    const styles = levelStyles
      ? LevelStyleSet.create(levelStyles)
      : LevelStyleSet.defaultsFor(profile);
    const styleValues = styles.values;
    const semanticTypography = LEVEL_STYLE_ROLES.map((role) =>
      semanticRoleRule(role, styleValues[role]),
    ).join('');

    return `
      ${embeddedFontFaces}
      @page {
        size: ${value.pageWidthInches}in ${value.pageHeightInches}in;
        margin-top: ${value.marginTopCentimeters}cm;
        margin-bottom: ${value.marginBottomCentimeters}cm;
        @bottom-center {
          content: counter(page);
          font-size: 9pt;
          color: #555;
        }
      }
      @page :right {
        margin-left: ${value.marginInsideCentimeters}cm;
        margin-right: ${value.marginOutsideCentimeters}cm;
      }
      @page :left {
        margin-left: ${value.marginOutsideCentimeters}cm;
        margin-right: ${value.marginInsideCentimeters}cm;
      }
      html, body { margin: 0; padding: 0; background: #e5e7eb; }
      body {
        color: #111827;
        font-family: '${value.bodyFontFamily}', ${fontFallback};
        font-size: ${value.bodyFontSizePoints}pt;
        line-height: ${value.lineHeight};
        text-rendering: geometricPrecision;
      }
      ${startPageNumber && startPageNumber > 1 ? `body { counter-reset: page ${startPageNumber - 1}; }` : ''}
      main.book { widows: 2; orphans: 2; counter-reset: folio 1; }
      p { margin: 0; text-align: justify; text-indent: ${value.firstLineIndentCentimeters}cm; }
      [data-semantic-role="titre-de-chapitre"] + [data-semantic-role="corps"],
      [data-semantic-role="sous-titre"] + [data-semantic-role="corps"] { text-indent: 0; }
      [data-semantic-role="titre-de-chapitre"] {
        break-before: page;
      }
      [data-semantic-role="titre-de-chapitre"]:first-child { break-before: auto; }
      ${semanticTypography}
      .pagedjs_pages { display: flex; flex-direction: column; align-items: center; gap: 24px; }
      .pagedjs_page { background: white; box-shadow: 0 4px 18px rgb(15 23 42 / 18%); }
      @media print {
        html, body { background: white; }
        .pagedjs_pages { display: block; }
        .pagedjs_page { margin: 0 !important; box-shadow: none !important; break-after: page; }
      }

      /* Liminal pages (front matter): lowercase roman numerals, each on its own page.
         The body's Arabic numbering must restart at 1, but Paged.js honours neither a
         mid-document reset of the page counter (non-persistent) nor a custom counter
         driven from an @page rule. The reliable levers, established empirically:
           - suppressing 'page' increment on liminal pages keeps the first body page at 1;
           - a content-driven 'folio' counter numbers the liminaires in roman.
         A margin box reads a custom counter as of the END of the PREVIOUS page, so the
         very first page can never see a seed — the half-title therefore carries no printed
         number (book convention anyway) while still advancing folio for the pages after it. */
      .liminal {
        page: liminal-page;
        counter-increment: folio 1;
        break-before: page;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        text-align: center;
      }
      .liminal:first-child { page: half-title-page; break-before: right; }
      @page half-title-page {
        counter-increment: page 0;
        @bottom-center { content: none; }
      }
      @page liminal-page {
        counter-increment: page 0;
        @bottom-center {
          content: counter(folio, lower-roman);
          font-size: 9pt;
          color: #555;
        }
      }

      /* Chapter sections: start on odd (right-hand) pages */
      .chapter { break-before: right; }
      .chapter:first-child { break-before: auto; }

      /* TOC: links with auto page numbers (target-counter), classique adds a dotted fill */
      .toc h2 {
        font-size: 14pt;
        font-weight: 700;
        margin: 0 0 24pt;
        text-align: center;
      }
      .toc ol {
        list-style: none;
        padding: 0;
        margin: 0;
        width: 100%;
        max-width: 80%;
        text-align: left;
      }
      .toc li { margin-bottom: 6pt; }
      /* Reset width/max-width: .toc ol's max-width:80% would otherwise cascade onto this
         nested list relative to its own <li> (already inside that 80%-capped box), landing
         its right edge at 80% of 80% instead of the top-level list's 80% — misaligning
         sub-entry page numbers against chapter-level ones. */
      .toc li ol {
        list-style: none;
        margin: 4pt 0 0;
        padding-left: 18pt;
        width: auto;
        max-width: none;
      }
      .toc a {
        text-decoration: none;
        color: inherit;
        display: flex;
        align-items: baseline;
        justify-content: space-between;
      }
      /* Paged.js resolves target-counter() per-link, late in pagination, and only reflows
         the matched <a> in isolation (no shared re-layout across TOC rows). A shrink-to-fit
         number box therefore settles at a different width per row (1 vs 2 vs 3 digits). A
         fixed min-width with right alignment keeps the box's size constant regardless of
         when or to what value it resolves, so rows line up. */
      .toc a::after {
        content: target-counter(attr(href url), page);
        white-space: nowrap;
        padding-left: 4pt;
        min-width: 1.8em;
        text-align: right;
        font-variant-numeric: tabular-nums;
      }

      /* Classique: dotted fill between title and page number. The CSS GCPM leader mechanism
         has no runtime handler in Paged.js (only target-counter does), so combining the two
         in one content value is invalid as a whole and silently drops both the dots and the
         number. Reproduced instead with a real, clipped element. */
      .toc--classique .toc-title {
        flex: 1 1 auto;
        overflow: hidden;
        white-space: nowrap;
      }
      .toc--classique .toc-title::after {
        content: ' . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ';
        padding-left: 4pt;
      }

      /* Littéraire: centered titles, no page numbers */
      .toc--litteraire a {
        justify-content: center;
      }
      .toc--litteraire a::after {
        content: none;
      }
    `;
  }
}
