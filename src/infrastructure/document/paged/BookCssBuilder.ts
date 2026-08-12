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
    honorBlankLines?: boolean,
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

    // A blank line the author typed (see TipTapToBookHtml) holds no content, so it generates no
    // line box and margin: 0 collapses it to nothing. A zero-width space restores a real line
    // box that inherits this paragraph's font-size and line-height, so the gap equals one line
    // of its own level. Generated content stays out of the selection: copy-paste is clean.
    // Omitted entirely for projects that do not honor blank lines, so their pagination is
    // bit-for-bit what it was before the feature existed.
    const blankLineRule = honorBlankLines ? 'p[data-blank-line]::before { content: "\\200B"; }' : '';

    return `
      ${embeddedFontFaces}
      @page {
        size: ${value.pageWidthInches}in ${value.pageHeightInches}in;
        margin-top: ${value.marginTopCentimeters}cm;
        margin-bottom: ${value.marginBottomCentimeters}cm;
        @bottom-center {
          content: none;
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
      main.book { widows: 2; orphans: 2; counter-reset: endnote 0; }
      p { margin: 0; text-align: justify; text-indent: ${value.firstLineIndentCentimeters}cm; }
      ${blankLineRule}
      [data-semantic-role="titre-de-chapitre"] + [data-semantic-role="corps"],
      [data-semantic-role="sous-titre"] + [data-semantic-role="corps"] { text-indent: 0; }
      [data-semantic-role="titre-de-chapitre"] + [data-semantic-role="corps"][data-indent="true"],
      [data-semantic-role="sous-titre"] + [data-semantic-role="corps"][data-indent="true"] { text-indent: ${value.firstLineIndentCentimeters}cm; }
      [data-semantic-role="titre-de-chapitre"] {
        break-before: page;
      }
      [data-semantic-role="titre-de-chapitre"]:first-child { break-before: auto; }
      [data-semantic-role="titre-de-chapitre"],
      [data-semantic-role="sous-titre"] { break-after: avoid; }
      ${semanticTypography}
      [data-semantic-role="sous-titre"] { text-indent: ${value.firstLineIndentCentimeters}cm; }
      .pagedjs_pages { display: flex; flex-direction: column; align-items: center; gap: 24px; }
      .pagedjs_page { background: white; box-shadow: 0 4px 18px rgb(15 23 42 / 18%); }
      @media print {
        html, body { background: white; }
        .pagedjs_pages { display: block; }
        .pagedjs_page { margin: 0 !important; box-shadow: none !important; break-after: page; }
      }

      /* Endnote call — a numbered superscript. The digit is a CSS counter (endnote), so it
         renumbers automatically as notes are added, removed or moved, exactly like the editor.
         The rich note body rides along in a hidden .endnote-body; the reading view reveals it in
         a floating bubble on hover/click. There is deliberately no compiled notes block here:
         the per-chapter compilation exists only at export. */
      .endnote-ref {
        counter-increment: endnote;
        vertical-align: super;
        font-size: 0.7em;
        line-height: 0;
        color: inherit;
        cursor: pointer;
        padding: 0 0.05em;
      }
      .endnote-ref::after { content: counter(endnote); }
      .endnote-ref:hover,
      .endnote-ref:focus-visible { text-decoration: underline; outline: none; }
      .endnote-body { display: none; }

      /* Export mode: the call becomes a round-trip link and prints its per-chapter number literally
         (from extractChapterEndnotes), so the CSS counter is suppressed to avoid a doubled digit.
         The link inherits the call's colour and drops the underline so it still reads as a call. */
      .endnote-ref--linked { counter-increment: none; }
      .endnote-ref--linked::after { content: none; }
      .endnote-ref__link { color: inherit; text-decoration: none; }

      /* The bubble is a single body-level, position: fixed element (see endnoteBubble.ts and
         PagedJsRenderer's inlined handler). Fixed + body-level is what lets it escape the
         Paged.js page boxes, which clip their overflow — an in-flow popover would be cut off at
         the page edge. Opening it never moves focus into it (a note's link stays reachable only
         by the reader's own Tab), and dismissal never steals focus back, so it never traps focus. */
      #endnote-bubble {
        position: fixed;
        display: none;
        z-index: 2147483647;
        max-width: 22em;
        padding: 0.6em 0.8em;
        border-radius: 6px;
        background: #1f2937;
        color: #f9fafb;
        font-size: 10pt;
        line-height: 1.4;
        text-indent: 0;
        text-align: left;
        box-shadow: 0 8px 24px rgb(15 23 42 / 35%);
      }
      #endnote-bubble[data-visible="true"] { display: block; }
      #endnote-bubble a { color: #93c5fd; }

      /* Liminal pages (front matter): each opens on a recto (right-hand) page. The actual
         Roman and Arabic folios are resolved after Paged.js has created physical pages (see
         PagedJsRenderer): Paged.js cannot scope the built-in page counter to front-matter blank
         versos, which made it omit body blank versos from Arabic numbering. */
      .liminal {
        page: liminal-page;
        break-before: right;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: calc(${value.pageHeightInches}in - ${value.marginTopCentimeters}cm - ${value.marginBottomCentimeters}cm);
        text-align: center;
      }
      .liminal:first-child { page: half-title-page; }
      /* Liminal titles have no dedicated typography otherwise and would inherit the body
         size (and its first-line text-indent, which shifts centered lines). Enlarge them
         and cancel the indent so the title page reads as a title page. */
      .book-half-title { font-size: 1.6em; font-weight: 700; text-indent: 0; }
      .book-title { font-size: 2.4em; font-weight: 700; line-height: 1.15; text-indent: 0; }
      .book-subtitle { font-size: 1.3em; font-style: italic; text-indent: 0; margin-top: 12pt; }
      .book-author { font-size: 1.4em; text-indent: 0; margin-top: 36pt; }
      /* Dedication and epigraph sit against the page's right edge (still vertically
         centered). The dedication keeps body typography; only the epigraph quote is italic. */
      .dedication-page,
      .epigraph-page { align-items: flex-end; text-align: right; }
      .epigraph-text { margin: 0; font-style: italic; }
      .epigraph-attribution { font-style: normal; margin-top: 6pt; }
      @page half-title-page {
        @bottom-center { content: none; }
      }
      @page liminal-page {
        @bottom-center { content: none; }
      }
      /* Blank versos never carry a visible folio. Their physical position is nevertheless
         retained by the renderer when it calculates the following Arabic page number. */
      @page :blank {
        @bottom-center { content: none; }
      }

      /* Custom annexes (front liminal or back matter): a centered title over a body block. */
      .annex-title { font-size: 1.4em; font-weight: 700; text-indent: 0; text-align: center; margin: 0 0 18pt; }
      .annex-body { text-indent: 0; }
      .liminal.annex-page { justify-content: flex-start; text-align: left; }

      /* Back matter: pages after the body. They continue the Arabic page numbering.
         The legal notice is the final colophon page and carries no printed folio. */
      .back-matter { break-before: page; }
      .colophon {
        page: colophon-page;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: calc(${value.pageHeightInches}in - ${value.marginTopCentimeters}cm - ${value.marginBottomCentimeters}cm);
        text-align: center;
      }
      .legal-notice-text { text-indent: 0; }
      .legal-notice-text p { text-align: center; }
      .colophon .book-isbn { margin-top: 12pt; }

      /* Compiled endnotes: a back-matter section (so it inherits .back-matter's page break),
         grouped by chapter. A fixed, careful default — slightly reduced body, hanging indent —
         not author-customisable for now. The note body paragraph is displayed inline so the
         number and the first line share a line under the hanging indent. */
      .endnotes-title { font-size: 14pt; font-weight: 700; text-align: center; margin: 0 0 24pt; text-indent: 0; }
      .endnotes-chapter { margin-bottom: 18pt; }
      .endnotes-chapter-title { font-size: 11pt; font-weight: 700; margin: 0 0 8pt; text-indent: 0; }
      .endnotes-list { list-style: none; margin: 0; padding: 0; font-size: 0.85em; }
      .endnote-item {
        margin: 0 0 6pt;
        padding-left: 1.6em;
        text-indent: -1.6em;
        text-align: left;
      }
      .endnote-item p { display: inline; margin: 0; text-indent: 0; }
      .endnote-backlink { color: inherit; text-decoration: none; font-weight: 600; }
      @page colophon-page {
        @bottom-center { content: none; }
      }

      /* Chapter sections start on odd (right-hand) pages. Later chapters force their own recto
         (.chapter { break-before: right }); the FIRST body page is forced at the .body-matter
         wrapper instead, and the first chapter waives its own break. This forces the body onto a
         recto exactly once (no double blank against the TOC that precedes it). The renderer then
         derives the first Arabic folio and subsequent physical offsets from the generated pages.
         The bare main.book > .chapter:first-child waiver still covers the no-front-matter case. */
      .body-matter { break-before: right; }
      .chapter { break-before: right; }
      main.book > .chapter:first-child { break-before: auto; }
      .body-matter > .chapter:first-child { break-before: auto; }

      /* TOC: the renderer assigns each link's physical Arabic page number after pagination;
         classique adds a dotted fill. The TOC is .liminal (for Roman folio numbering) but, unlike the
         single centered front-matter pages, it is a multi-page flowing list. Override the
         inherited vertical centering: start content at the top of every page and drop the
         full-height min-height, so the last (short) page's entries don't float in the middle.
         Horizontal centering (align-items) is left untouched. The TOC opens on a recto too,
         inherited from .liminal { break-before: right } above. */
      .toc { justify-content: flex-start; min-height: 0; }
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
      /* The title takes only the space it needs and may wrap; the leader (when a style shows one)
         absorbs the rest of the line so the page number stays right-aligned. */
      .toc-title { flex: 0 1 auto; overflow-wrap: break-word; }
      .toc-leader { flex: 1 1 auto; }
      /* Resolved after pagination from the physical Paged.js page boxes (rather than its
         global page counter), so a blank body verso is included in the following number.
         A fixed min-width with right alignment keeps the box's size constant for 1–3 digits. */
      .toc a::after {
        content: attr(data-resolved-page);
        white-space: nowrap;
        padding-left: 4pt;
        min-width: 1.8em;
        text-align: right;
        font-variant-numeric: tabular-nums;
      }

      /* Classique: dotted leader between title and page number. The CSS GCPM leader mechanism
         has no runtime handler in Paged.js, so it silently drops the decorative fill. Reproduced
         instead with a real .toc-leader element: a dotted
         bottom border on a flex:1 box fills exactly the free space on a single line — a fixed
         string of dots (the old approach) overflowed onto extra lines when the title was short.
         translateY lifts the border off the baseline so the dots sit level with the x-height. */
      .toc--classique .toc-leader {
        border-bottom: 1px dotted currentColor;
        transform: translateY(-3pt);
        margin: 0 4pt;
      }
      /* Hierarchy — chapters read as headings, sous-titres recede. Weight, size and colour carry
         the hierarchy alone, so classique keeps the same typographic texture (font, casing,
         tracking) as epure/litteraire and doesn't read as a different design. The chapter title
         is shown verbatim: no generated numbering, so we never double up on an author title that
         already carries its own number ("Chapitre 1", "I. L'aube", …). */
      .toc--classique .toc-chapter { margin-top: 12pt; }
      .toc--classique .toc-chapter > a .toc-title {
        font-weight: 600;
      }
      .toc--classique .toc-subtitle {
        font-size: 10pt;
        color: #555;
      }
      .toc--classique .toc-subtitle .toc-leader {
        transform: translateY(-2pt);
      }

      /* Littéraire: centered titles, no page numbers, no leader (it would break centring). */
      .toc--litteraire a {
        justify-content: center;
      }
      .toc--litteraire a::after {
        content: none;
      }
      .toc--litteraire .toc-leader {
        display: none;
      }
    `;
  }
}
