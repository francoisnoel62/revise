// ABOUTME: E2E proof that an author can restore the first-line indent on the paragraph right
// ABOUTME: after a heading by opting in with data-indent, through the real Paged.js pipeline.

import { expect, test } from '@playwright/test';
import type { JSONContent } from '@tiptap/core';
import { PublicationProfile } from '../../src/domain/value-objects/PublicationProfile';
import { PagedJsRenderer } from '../../src/infrastructure/document/paged/PagedJsRenderer';
import { TipTapToBookHtml } from '../../src/infrastructure/document/paged/TipTapToBookHtml';
import { PlaywrightBrowserLauncher } from '../../src/infrastructure/document/paged/PlaywrightBrowserLauncher';

test.setTimeout(120_000);

// The adjacent-sibling rule strips the first-line indent off the first body paragraph after a
// heading. Before the orphan-heading fix, authors restored that indent by leaving a blank line;
// that blank line is now dropped, so the indent must instead follow the author's explicit
// data-indent choice. This document exercises every combination so the cascade is proven end-to-end.
function buildContent(): JSONContent {
  const filler =
    'La lumière déclinait lentement sur les toits de la vieille ville tandis que les cloches ' +
    'égrenaient les heures et que le silence retombait sur chaque pas des passants attardés.';

  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2, semanticRole: 'sous-titre' },
        content: [{ type: 'text', text: 'Sous-titre indenté' }],
      },
      {
        type: 'paragraph',
        attrs: { semanticRole: 'corps', indent: true },
        content: [{ type: 'text', text: `INDENT-SOUS-TITRE — ${filler}` }],
      },
      {
        type: 'heading',
        attrs: { level: 2, semanticRole: 'sous-titre' },
        content: [{ type: 'text', text: 'Sous-titre sans indentation' }],
      },
      {
        type: 'paragraph',
        attrs: { semanticRole: 'corps' },
        content: [{ type: 'text', text: `PLAT-SOUS-TITRE — ${filler}` }],
      },
      {
        type: 'heading',
        attrs: { level: 1, semanticRole: 'titre-de-chapitre' },
        content: [{ type: 'text', text: 'Chapitre indenté' }],
      },
      {
        type: 'paragraph',
        attrs: { semanticRole: 'corps', indent: true },
        content: [{ type: 'text', text: `INDENT-CHAPITRE — ${filler}` }],
      },
    ],
  };
}

test('the author restores the first-line indent after a heading with data-indent', async () => {
  const renderer = new PagedJsRenderer();
  const converter = new TipTapToBookHtml();
  const profile = PublicationProfile.kdpSixByNine();
  const html = renderer.render({
    bodyHtml: converter.convert(buildContent()),
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

    const indents = await page.evaluate<Record<string, number>>(MEASURE_TEXT_INDENTS_JS);

    // Profile indent is 0.8cm ≈ 30px at 96dpi; anything clearly above zero proves the
    // author's opt-in survived the cascade against the adjacent-sibling zeroing rule.
    expect(indents['INDENT-SOUS-TITRE']).toBeGreaterThan(20);
    expect(indents['INDENT-CHAPITRE']).toBeGreaterThan(20);
    // Control: without data-indent the first paragraph after a heading stays flush.
    expect(indents['PLAT-SOUS-TITRE']).toBe(0);
  } finally {
    await browser.close();
  }
});

const MEASURE_TEXT_INDENTS_JS = `(function () {
  var paragraphs = Array.prototype.slice.call(document.querySelectorAll('[data-semantic-role="corps"]'));
  var markers = ['INDENT-SOUS-TITRE', 'PLAT-SOUS-TITRE', 'INDENT-CHAPITRE'];
  var result = {};
  markers.forEach(function (marker) {
    var p = paragraphs.find(function (el) { return el.textContent.indexOf(marker) === 0; });
    result[marker] = p ? parseFloat(getComputedStyle(p).textIndent) || 0 : -1;
  });
  return result;
})()`;
