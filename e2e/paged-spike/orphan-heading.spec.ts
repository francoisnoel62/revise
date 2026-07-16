// ABOUTME: E2E proof that a sous-titre can be stranded at the bottom of a page, cut off
// ABOUTME: from the paragraph that follows it, despite BookCssBuilder's break-after: avoid.

import { expect, test } from '@playwright/test';
import type { JSONContent } from '@tiptap/core';
import { PublicationProfile } from '../../src/domain/value-objects/PublicationProfile';
import { PagedJsRenderer } from '../../src/infrastructure/document/paged/PagedJsRenderer';
import { TipTapToBookHtml } from '../../src/infrastructure/document/paged/TipTapToBookHtml';
import { PlaywrightBrowserLauncher } from '../../src/infrastructure/document/paged/PlaywrightBrowserLauncher';

test.setTimeout(120_000);

// Many repeated sous-titre/paragraph pairs, none placed at a deliberately chosen offset.
// Because each block's length isn't a divisor of a page's capacity, the position of the
// Nth sous-titre within its page drifts block to block — across enough repetitions some
// of them are guaranteed to fall right at a page's bottom edge, exactly where break-after:
// avoid is supposed to keep them glued to the paragraph underneath.
const BLOCK_COUNT = 60;

function paddedIndex(index: number): string {
  return String(index).padStart(3, '0');
}

// Mirrors a real authoring habit: pressing Enter after a subtitle to leave a blank line
// for visual spacing before typing the next paragraph. TipTap serializes that as an empty
// paragraph node sitting between the heading and the real body paragraph.
function buildChapterContent(): JSONContent {
  const filler =
    'La lumière déclinait lentement sur les toits de la vieille ville tandis que les cloches ' +
    'égrenaient les heures et que le silence retombait, lourd, sur chaque pas des passants attardés.';

  const blocks: JSONContent[] = [];
  for (let i = 0; i < BLOCK_COUNT; i++) {
    blocks.push({
      type: 'paragraph',
      attrs: { semanticRole: 'corps' },
      content: [{ type: 'text', text: filler }],
    });
    blocks.push({
      type: 'heading',
      attrs: { level: 2, semanticRole: 'sous-titre' },
      content: [{ type: 'text', text: `Sous-titre ${paddedIndex(i)}` }],
    });
    blocks.push({ type: 'paragraph' }); // the blank line
    blocks.push({
      type: 'paragraph',
      attrs: { semanticRole: 'corps' },
      content: [{ type: 'text', text: `MARQUEUR-${paddedIndex(i)} — ce paragraphe doit rester sur la page de son sous-titre.` }],
    });
  }
  return { type: 'doc', content: blocks };
}

test('a sous-titre never ends a page separated from the paragraph that follows it', async () => {
  const renderer = new PagedJsRenderer();
  const converter = new TipTapToBookHtml();
  const profile = PublicationProfile.kdpSixByNine();
  const html = renderer.render({
    bodyHtml: converter.convert(buildChapterContent()),
    profile,
    assetBaseUrl: 'http://localhost:3000',
  });

  const launcher = new PlaywrightBrowserLauncher();
  const browser = await launcher.launch({ headless: true });
  try {
    const value = profile.values;
    const page = await browser.newPage({
      viewport: {
        width: Math.round(value.pageWidthInches * 96),
        height: Math.round(value.pageHeightInches * 96),
      },
    });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () =>
        document.documentElement.dataset.pagedReady === 'true' ||
        typeof document.documentElement.dataset.pagedError === 'string',
      { timeout: 100_000 },
    );

    const pagedError = await page.evaluate<string | null>(
      'document.documentElement.dataset.pagedError || null',
    );
    expect(pagedError).toBeNull();

    const pairs = await page.evaluate<OrphanCheck[]>(EXTRACT_HEADING_PARAGRAPH_PAGES_JS);

    // Every sous-titre and its immediately-following paragraph must print on the same
    // physical page. A mismatch means the sous-titre was left alone at the page's bottom
    // while the paragraph was pushed to the next page — the reported orphan-heading bug.
    const strandedPairs = pairs.filter(
      (pair) => pair.headingPage !== null && pair.paragraphPage !== null && pair.headingPage !== pair.paragraphPage,
    );
    expect(strandedPairs, `sous-titres séparés de leur paragraphe :\n${JSON.stringify(strandedPairs, null, 2)}`).toEqual([]);
  } finally {
    await browser.close();
  }
});

interface OrphanCheck {
  readonly index: number;
  readonly headingPage: number | null;
  readonly paragraphPage: number | null;
}

const EXTRACT_HEADING_PARAGRAPH_PAGES_JS = `(function () {
  var pages = Array.prototype.slice.call(document.querySelectorAll('.pagedjs_pages .pagedjs_page'));
  function pageIndexOf(el) {
    var node = el;
    while (node && !(node.classList && node.classList.contains('pagedjs_page'))) {
      node = node.parentElement;
    }
    return node ? pages.indexOf(node) + 1 : null;
  }
  var headings = Array.prototype.slice.call(document.querySelectorAll('[data-semantic-role="sous-titre"]'));
  var paragraphs = Array.prototype.slice.call(document.querySelectorAll('[data-semantic-role="corps"]'));
  var results = [];
  for (var i = 0; i < ${BLOCK_COUNT}; i++) {
    var suffix = String(i).padStart(3, '0');
    var headingText = 'Sous-titre ' + suffix;
    var marker = 'MARQUEUR-' + suffix;
    var heading = headings.find(function (h) { return h.textContent === headingText; });
    var paragraph = paragraphs.find(function (p) { return p.textContent.indexOf(marker) === 0; });
    results.push({
      index: i,
      headingPage: heading ? pageIndexOf(heading) : null,
      paragraphPage: paragraph ? pageIndexOf(paragraph) : null,
    });
  }
  return results;
})()`;
