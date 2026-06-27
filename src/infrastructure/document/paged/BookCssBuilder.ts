// ABOUTME: Converts a publication profile into deterministic CSS paged-media rules.
// ABOUTME: Centralizes page geometry and typography so preview and PDF cannot drift.

import type { PublicationProfile } from '@/domain/value-objects/PublicationProfile';

export class BookCssBuilder {
  build(profile: PublicationProfile, assetBaseUrl: string): string {
    const value = profile.values;
    const assets = assetBaseUrl.replace(/\/$/, '');

    return `
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
      }
      @page {
        size: ${value.pageWidthInches}in ${value.pageHeightInches}in;
        margin-top: ${value.marginTopCentimeters}cm;
        margin-bottom: ${value.marginBottomCentimeters}cm;
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
        font-family: '${value.bodyFontFamily}', serif;
        font-size: ${value.bodyFontSizePoints}pt;
        line-height: ${value.lineHeight};
        text-rendering: geometricPrecision;
      }
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
      .pagedjs_pages { display: flex; flex-direction: column; align-items: center; gap: 24px; }
      .pagedjs_page { background: white; box-shadow: 0 4px 18px rgb(15 23 42 / 18%); }
      @media print {
        html, body { background: white; }
        .pagedjs_pages { display: block; }
        .pagedjs_page { margin: 0 !important; box-shadow: none !important; break-after: page; }
      }
    `;
  }
}
