// ABOUTME: Converts a publication profile into deterministic CSS paged-media rules.
// ABOUTME: Centralizes page geometry and typography so preview and PDF cannot drift.

import type { PublicationProfile } from '@/domain/value-objects/PublicationProfile';

export class BookCssBuilder {
  build(
    profile: PublicationProfile,
    assetBaseUrl: string,
    startPageNumber?: number,
    resetBodyMatterCounter = false,
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
      ${resetBodyMatterCounter ? '.body-matter { counter-reset: page 0; }' : ''}
      main.book { widows: 2; orphans: 2; }
      p { margin: 0; text-align: justify; text-indent: ${value.firstLineIndentCentimeters}cm; }
      h1 + p, h2 + p { text-indent: 0; }
      h1 {
        break-before: page;
        font-size: 14pt;
        font-weight: 700;
        margin: 48pt 0 24pt;
        text-align: center;
      }
      h1:first-child { break-before: auto; }
      h2 {
        font-size: 12pt;
        font-weight: 700;
        margin: 24pt 0 12pt;
        text-align: center;
      }
      .pagedjs_pages { display: flex; flex-direction: column; align-items: center; gap: 24px; }
      .pagedjs_page { background: white; box-shadow: 0 4px 18px rgb(15 23 42 / 18%); }
      @media print {
        html, body { background: white; }
        .pagedjs_pages { display: block; }
        .pagedjs_page { margin: 0 !important; box-shadow: none !important; break-after: page; }
      }

      /* Liminal pages (front matter): roman numerals, each on its own page */
      .liminal {
        page: liminal-page;
        break-before: page;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        text-align: center;
      }
      .liminal:first-child { break-before: right; }
      @page liminal-page {
        @bottom-center {
          content: counter(page, lower-roman);
          font-size: 9pt;
          color: #555;
        }
      }

      /* Chapter sections: start on odd (right-hand) pages */
      .chapter { break-before: right; }
      .chapter:first-child { break-before: auto; }

      /* TOC: links with leader dots and auto page numbers */
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
      .toc a {
        text-decoration: none;
        color: inherit;
        display: flex;
        justify-content: space-between;
      }
      .toc a::after {
        content: leader('.') target-counter(attr(href url), page);
        white-space: nowrap;
        padding-left: 4pt;
      }
    `;
  }
}
