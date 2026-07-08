// ABOUTME: E2E tests for the whole-book preview — the real export PDF, generated server-side and cached.
// ABOUTME: Covers PDF parity, resolved Arabic "1" on the first body page, passerelle guard, #page nav, cold/hot budget.

import { test, expect } from '@playwright/test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  TEST_BOOK_PREVIEW_PROJECT_ID,
  TEST_BOOK_PREVIEW_PASSERELLE_PROJECT_ID,
  TEST_BOOK_PREVIEW_LARGE_PROJECT_ID,
  TEST_BOOK_PREVIEW_TOC_PROJECT_ID,
  TEST_BOOK_PREVIEW_TOC_SUBTITLE,
  TEST_BOOK_PREVIEW_ALIGN_PROJECT_ID,
  TEST_BOOK_PREVIEW_ALIGN_TITLE,
  clearBookPreviewCache,
} from '../helpers/seed';

const BOOK_PREVIEW_URL = `/book-preview?project=${TEST_BOOK_PREVIEW_PROJECT_ID}`;
const ALIGN_BOOK_PREVIEW_URL = `/book-preview?project=${TEST_BOOK_PREVIEW_ALIGN_PROJECT_ID}`;
const TOC_BOOK_PREVIEW_URL = `/book-preview?project=${TEST_BOOK_PREVIEW_TOC_PROJECT_ID}`;
const TOC_SETTINGS_URL = `/project/${TEST_BOOK_PREVIEW_TOC_PROJECT_ID}/cockpit/settings`;

// Drives the real "Sommaire" settings card (Profondeur/Design selects) end to end,
// per the fiche's "E2E d'abord : activer les sous-titres et changer de design se
// reflètent dans l'aperçu" requirement — no direct DB seeding of the setting under test.
async function setTocStyleViaSettingsUi(page: import('@playwright/test').Page, label: string): Promise<void> {
  await page.goto(TOC_SETTINGS_URL);
  await page.getByTestId('toc-style-select').click();
  await page.getByRole('option', { name: label }).click();
  // The settings page stacks several independent "Enregistrer" buttons (Sommaire card,
  // autocomplete, canon extraction); the Sommaire form's is the first one in the DOM.
  await page.getByRole('button', { name: /enregistrer/i }).first().click();
  await expect(page.getByText('Modifications enregistrées')).toBeVisible();
}

async function setTocDepthViaSettingsUi(page: import('@playwright/test').Page, label: string): Promise<void> {
  await page.goto(TOC_SETTINGS_URL);
  await page.getByTestId('toc-depth-select').click();
  await page.getByRole('option', { name: label }).click();
  // The settings page stacks several independent "Enregistrer" buttons (Sommaire card,
  // autocomplete, canon extraction); the Sommaire form's is the first one in the DOM.
  await page.getByRole('button', { name: /enregistrer/i }).first().click();
  await expect(page.getByText('Modifications enregistrées')).toBeVisible();
}

// Reads all text on a given 1-indexed PDF page (unlike footerOf, which isolates the footer).
async function textOf(pdf: Uint8Array, pageNumber: number): Promise<string> {
  const doc = await getDocument({ data: pdf }).promise;
  const page = await doc.getPage(pageNumber);
  const content = await page.getTextContent();
  return content.items.map((i: { str?: string }) => i.str ?? '').join(' ');
}

// Reads text from every page 1..count of the same PDF. Loading one shared pdfjs document and
// walking pages sequentially avoids a DataCloneError from opening the same buffer concurrently.
async function textOfPages(pdf: Uint8Array, count: number): Promise<string[]> {
  const doc = await getDocument({ data: pdf }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= count; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((it: { str?: string }) => it.str ?? '').join(' '));
  }
  return pages;
}

// Locates a text run containing `needle` on a 1-indexed page and returns its horizontal
// midpoint alongside the page width (both in PDF points). A centered run's midpoint sits near
// pageWidth/2; a left-aligned (or single-line justified) run's midpoint sits far to the left.
async function horizontalCenterOf(
  pdf: Uint8Array,
  pageNumber: number,
  needle: string,
): Promise<{ centerX: number; pageWidth: number }> {
  const doc = await getDocument({ data: pdf }).promise;
  const page = await doc.getPage(pageNumber);
  const pageWidth = page.getViewport({ scale: 1 }).width;
  const content = await page.getTextContent();
  const items = content.items as Array<{ str?: string; transform: number[]; width: number }>;
  const item = items.find((i) => (i.str ?? '').includes(needle));
  if (!item) throw new Error(`Text "${needle}" not found on page ${pageNumber}`);
  return { centerX: item.transform[4] + item.width / 2, pageWidth };
}

// Reads the bottom-most text run (the footer page number) on a given 1-indexed PDF page.
async function footerOf(pdf: Uint8Array, pageNumber: number): Promise<string> {
  const doc = await getDocument({ data: pdf }).promise;
  const page = await doc.getPage(pageNumber);
  const content = await page.getTextContent();
  const items = content.items.filter((i: { str?: string }) => i.str && i.str.trim());
  if (items.length === 0) return '';
  const bottom = items.reduce(
    (min: { transform: number[]; str: string }, i: { transform: number[]; str: string }) =>
      i.transform[5] < min.transform[5] ? i : min,
    items[0] as { transform: number[]; str: string }
  );
  return bottom.str.trim();
}

test.describe('whole-book preview', () => {
  test('renders the export PDF in the viewer and reports a page count', async ({ page }) => {
    await page.goto(BOOK_PREVIEW_URL);

    const status = page.getByTestId('book-preview-status');
    await expect(status).toContainText('pages', { timeout: 60_000 });

    const iframe = page.getByTestId('book-preview-pdf');
    await expect(iframe).toBeVisible();
    expect(await iframe.getAttribute('src')).toContain('/api/book-preview/pdf');
  });

  test('shows chapter titles in the navigation sidebar', async ({ page }) => {
    await page.goto(BOOK_PREVIEW_URL);

    const nav = page.getByTestId('chapter-navigation');
    await expect(nav.getByText('Chapitre 1 — La Librairie')).toBeVisible({ timeout: 60_000 });
    await expect(nav.getByText('Chapitre 2 — Le Lendemain')).toBeVisible();
  });

  test('prints the resolved Arabic "1" on the first body page of the export PDF', async ({ page }) => {
    await page.goto(BOOK_PREVIEW_URL);

    const status = page.getByTestId('book-preview-status');
    await expect(status).toContainText('pages', { timeout: 60_000 });

    // The sidebar reports the physical page where the first chapter starts — i.e. the
    // first body page, the one that must read Arabic "1" after the roman-numeral liminaires.
    const firstChapter = page.getByTestId('chapter-navigation').locator('[data-chapter-id]').first();
    const firstBodyPage = Number(await firstChapter.getAttribute('data-page-number'));
    expect(firstBodyPage).toBeGreaterThan(1); // liminaires precede the body

    // Fetch the actual cached PDF (auth cookies ride along) and read the resolved footer.
    const src = await page.getByTestId('book-preview-pdf').getAttribute('src');
    const pdfUrl = (src ?? '').split('#')[0];
    const response = await page.request.get(pdfUrl);
    expect(response.ok()).toBeTruthy();
    const pdf = new Uint8Array(await response.body());

    expect(await footerOf(pdf, firstBodyPage)).toBe('1');
  });

  test('offers only the kdp-6x9 and a5 profiles in the preview selector', async ({ page }) => {
    await page.goto(BOOK_PREVIEW_URL);

    const selector = page.getByTestId('preview-profile-selector');
    await expect(selector).toBeVisible({ timeout: 60_000 });

    await expect(selector.locator('[data-profile]')).toHaveCount(2);
    await expect(selector.locator('[data-profile="kdp-6x9"]')).toBeVisible();
    await expect(selector.locator('[data-profile="a5"]')).toBeVisible();
  });

  test('jumps to a chapter page via the PDF #page anchor', async ({ page }) => {
    await page.goto(BOOK_PREVIEW_URL);

    const status = page.getByTestId('book-preview-status');
    await expect(status).toContainText('pages', { timeout: 60_000 });

    const ch2 = page.getByTestId('chapter-navigation').locator('[data-chapter-id]').nth(1);
    const ch2Page = await ch2.getAttribute('data-page-number');
    await ch2.click();

    await expect(page.getByTestId('book-preview-pdf')).toHaveAttribute('src', new RegExp(`#page=${ch2Page}$`));
  });

  test('centers a chapter title in the export PDF despite the manuscript\'s inline textAlign', async ({ page }) => {
    // The seeded title heading carries textAlign:'justify' (the editor's default). If it leaked
    // into the rendered HTML as an inline style it would out-specify the profile's centering rule
    // and the single-line title would render left. The whole-book pipeline strips presentation
    // attrs, so the profile's [data-semantic-role="titre-de-chapitre"] centering must win.
    await clearBookPreviewCache(TEST_BOOK_PREVIEW_ALIGN_PROJECT_ID);
    await page.goto(ALIGN_BOOK_PREVIEW_URL);

    const status = page.getByTestId('book-preview-status');
    await expect(status).toContainText('pages', { timeout: 60_000 });

    const firstChapter = page.getByTestId('chapter-navigation').locator('[data-chapter-id]').first();
    const titlePage = Number(await firstChapter.getAttribute('data-page-number'));
    expect(titlePage).toBeGreaterThan(0);

    const src = await page.getByTestId('book-preview-pdf').getAttribute('src');
    const pdfUrl = (src ?? '').split('#')[0];
    const response = await page.request.get(pdfUrl);
    expect(response.ok()).toBeTruthy();
    const pdf = new Uint8Array(await response.body());

    const { centerX, pageWidth } = await horizontalCenterOf(pdf, titlePage, TEST_BOOK_PREVIEW_ALIGN_TITLE);
    // Centered: the title's horizontal midpoint sits within 8% of the page center. A left-aligned
    // title (the pre-fix behaviour) would start at the inside margin, putting its midpoint far left.
    expect(Math.abs(centerX - pageWidth / 2)).toBeLessThan(pageWidth * 0.08);
  });

  test('offers no whole-book preview for the passerelle profile', async ({ page }) => {
    await page.goto(`/book-preview?project=${TEST_BOOK_PREVIEW_PASSERELLE_PROJECT_ID}`);

    await expect(page.getByText(/pas disponible pour le profil/i)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('book-preview-pdf')).toHaveCount(0);
  });

  // Cold (first open → server generation) and hot (cached read) are measured separately.
  // Budgets are deliberately generous for a dev server: the realistic fixture (~6 chapters)
  // stands in for the production ~300-400 page target, generated once then served from cache.
  // The meaningful invariant is that the hot read is dramatically faster than cold generation.
  test('serves a cold render then a fast hot read within budget', async ({ page }) => {
    test.setTimeout(150_000);

    const COLD_BUDGET_MS = 90_000;
    const HOT_BUDGET_MS = 10_000;
    const largeUrl = `/book-preview?project=${TEST_BOOK_PREVIEW_LARGE_PROJECT_ID}`;
    const status = page.getByTestId('book-preview-status');

    // Force a cold cache, then time the generation.
    await clearBookPreviewCache(TEST_BOOK_PREVIEW_LARGE_PROJECT_ID);
    const coldStart = Date.now();
    await page.goto(largeUrl);
    await expect(status).toContainText('pages', { timeout: COLD_BUDGET_MS });
    const coldMs = Date.now() - coldStart;

    // Reopen: the cache is warm, so this must be much faster (no Chromium repagination).
    const hotStart = Date.now();
    await page.goto(largeUrl);
    await expect(status).toContainText('pages', { timeout: HOT_BUDGET_MS });
    const hotMs = Date.now() - hotStart;

    expect(hotMs).toBeLessThan(HOT_BUDGET_MS);
    expect(hotMs).toBeLessThan(coldMs);
  });

  // Serial: both tests hit the same project's cold cache; running them concurrently
  // races two Chromium generations against each other and can starve either past its budget.
  test.describe.serial('configurable sommaire (tocDepth: chapters-and-subtitles, tocStyle: litteraire)', () => {
    test('renders the sous-titre in the sidebar, nested under its chapter, and navigates to its real PDF page', async ({ page }) => {
      await clearBookPreviewCache(TEST_BOOK_PREVIEW_TOC_PROJECT_ID);
      await page.goto(TOC_BOOK_PREVIEW_URL);

      const status = page.getByTestId('book-preview-status');
      await expect(status).toContainText('pages', { timeout: 60_000 });

      const subtitleButton = page.getByTestId('chapter-navigation').getByRole('button', {
        name: TEST_BOOK_PREVIEW_TOC_SUBTITLE,
      });
      await expect(subtitleButton).toBeVisible();

      const subtitlePage = Number(await subtitleButton.getAttribute('data-page-number'));
      expect(subtitlePage).toBeGreaterThan(0);

      await subtitleButton.click();
      await expect(page.getByTestId('book-preview-pdf')).toHaveAttribute(
        'src',
        new RegExp(`#page=${subtitlePage}$`),
      );

      // Prove the click lands on the page where the sous-titre is actually printed —
      // not just that the UI produced *a* #page=N anchor.
      const src = await page.getByTestId('book-preview-pdf').getAttribute('src');
      const pdfUrl = (src ?? '').split('#')[0];
      const response = await page.request.get(pdfUrl);
      expect(response.ok()).toBeTruthy();
      const pdf = new Uint8Array(await response.body());

      expect(await textOf(pdf, subtitlePage)).toContain(TEST_BOOK_PREVIEW_TOC_SUBTITLE);
    });

    test('prints the TOC in the littéraire design: sous-titre entry, no leader dots/page numbers next to it', async ({ page }) => {
      await page.goto(TOC_BOOK_PREVIEW_URL);

      const status = page.getByTestId('book-preview-status');
      await expect(status).toContainText('pages', { timeout: 60_000 });

      // The first chapter's physical page tells us how many liminal pages (half-title + TOC) precede it.
      const nav = page.getByTestId('chapter-navigation');
      const firstChapterButton = nav.locator('[data-chapter-id]').first();
      const firstBodyPage = Number(await firstChapterButton.getAttribute('data-page-number'));

      const src = await page.getByTestId('book-preview-pdf').getAttribute('src');
      const pdfUrl = (src ?? '').split('#')[0];
      const response = await page.request.get(pdfUrl);
      const pdf = new Uint8Array(await response.body());

      const liminalPages = await textOfPages(pdf, firstBodyPage - 1);
      const tocText = liminalPages.find((t) => t.includes('Table des matières'));

      expect(tocText).toBeDefined();
      expect(tocText).toContain(TEST_BOOK_PREVIEW_TOC_SUBTITLE);

      // Littéraire suppresses target-counter entirely: no digit trails the sous-titre entry.
      expect(tocText).not.toMatch(new RegExp(`${TEST_BOOK_PREVIEW_TOC_SUBTITLE}\\s+\\d`));
      // No leader('.') run either (classique/épuré both would print one).
      expect(tocText).not.toMatch(/\.{4,}/);
    });

    test('toggling tocStyle to épuré via the settings UI reflects in the aperçu: page numbers, no leader dots', async ({ page }) => {
      await setTocStyleViaSettingsUi(page, 'Épuré');

      try {
        await page.goto(TOC_BOOK_PREVIEW_URL);
        const status = page.getByTestId('book-preview-status');
        await expect(status).toContainText('pages', { timeout: 60_000 });

        const nav = page.getByTestId('chapter-navigation');
        const firstChapterButton = nav.locator('[data-chapter-id]').first();
        const firstBodyPage = Number(await firstChapterButton.getAttribute('data-page-number'));

        const src = await page.getByTestId('book-preview-pdf').getAttribute('src');
        const pdfUrl = (src ?? '').split('#')[0];
        const response = await page.request.get(pdfUrl);
        const pdf = new Uint8Array(await response.body());

        const liminalPages = await textOfPages(pdf, firstBodyPage - 1);
        const tocText = liminalPages.find((t) => t.includes('Table des matières'));

        expect(tocText).toBeDefined();
        expect(tocText).toContain(TEST_BOOK_PREVIEW_TOC_SUBTITLE);
        // Épuré: a page number DOES trail the sous-titre entry (target-counter), but no leader('.') run.
        expect(tocText).toMatch(new RegExp(`${TEST_BOOK_PREVIEW_TOC_SUBTITLE}\\s+\\d`));
        expect(tocText).not.toMatch(/\.{4,}/);
      } finally {
        // Restore the seeded default so this test doesn't leak state into later runs.
        await setTocStyleViaSettingsUi(page, 'Littéraire');
      }
    });

    test('toggling tocDepth off via the settings UI hides the sous-titre from the aperçu nav, toggling it back restores it', async ({ page }) => {
      await setTocDepthViaSettingsUi(page, 'Chapitres seuls');

      try {
        await page.goto(TOC_BOOK_PREVIEW_URL);
        const status = page.getByTestId('book-preview-status');
        await expect(status).toContainText('pages', { timeout: 60_000 });

        await expect(
          page.getByTestId('chapter-navigation').getByRole('button', { name: TEST_BOOK_PREVIEW_TOC_SUBTITLE }),
        ).toHaveCount(0);
      } finally {
        // Restore the seeded default (chapters-and-subtitles) for later runs.
        await setTocDepthViaSettingsUi(page, 'Chapitres et sous-titres');
      }

      await page.goto(TOC_BOOK_PREVIEW_URL);
      const status = page.getByTestId('book-preview-status');
      await expect(status).toContainText('pages', { timeout: 60_000 });
      await expect(
        page.getByTestId('chapter-navigation').getByRole('button', { name: TEST_BOOK_PREVIEW_TOC_SUBTITLE }),
      ).toBeVisible();
    });
  });
});
