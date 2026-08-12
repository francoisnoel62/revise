// ABOUTME: E2E tests for "Corriger le chapitre" — the local grammar corrector in the editor.
// ABOUTME: Covers: green dotted underlines on demand, the palette naming "Accord", applying a fix.

import { test, expect, type Page } from '@playwright/test';
import { TEST_GRAMMAR_PROJECT_ID, seedGrammarProject } from '../helpers/seed';

const EDITOR_URL = `/editor?project=${TEST_GRAMMAR_PROJECT_ID}`;

// The server loads the grammar engine's rules and dictionaries (~25 MB) the first
// time a chapter is checked. That one-off cost dominates the first assertion;
// later checks answer in a few seconds.
const FIRST_UNDERLINE_TIMEOUT = 120_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function openGrammarEditor(page: Page) {
  await page.goto(EDITOR_URL);
  const editor = page.locator('.ProseMirror');
  await expect(editor).toBeVisible({ timeout: 15_000 });
  return editor;
}

/** Runs the correction from the command palette (Ctrl+Shift+I). */
async function correctChapter(page: Page) {
  await page.keyboard.press('Control+Shift+I');
  const entry = page.getByText('Corriger le chapitre');
  await expect(entry).toBeVisible({ timeout: 10_000 });
  await entry.click();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Grammar correction in the editor', () => {
  // The editor autosaves an applied correction back to the seeded chapter, so the
  // faulty text has to be restored before each test. The timeout covers the
  // engine's cold start on the server.
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  test.beforeEach(async () => {
    await seedGrammarProject();
  });

  test('nothing is underlined before the author asks for a correction', async ({ page }) => {
    await openGrammarEditor(page);

    await page.waitForTimeout(4_000);
    await expect(page.locator('.grammar-error')).toHaveCount(0);
  });

  test('"Corriger le chapitre" underlines the agreement errors', async ({ page }) => {
    await openGrammarEditor(page);
    await correctChapter(page);

    const underlines = page.locator('.grammar-error');
    await expect(underlines.first()).toBeVisible({ timeout: FIRST_UNDERLINE_TIMEOUT });

    // The chapter title and the paragraph each carry one error.
    await expect(page.locator('.grammar-error', { hasText: 'maison' })).toBeVisible();
    await expect(page.locator('.grammar-error', { hasText: 'chien' })).toBeVisible();
  });

  test('a grammar underline is dotted, not the wavy line of a misspelling', async ({ page }) => {
    await openGrammarEditor(page);
    await correctChapter(page);

    const underline = page.locator('.grammar-error').first();
    await expect(underline).toBeVisible({ timeout: FIRST_UNDERLINE_TIMEOUT });

    const style = await underline.evaluate(
      (element) => getComputedStyle(element).textDecorationStyle
    );
    expect(style).toBe('dotted');
  });

  test('clicking an underline opens the palette, which names the category', async ({ page }) => {
    await openGrammarEditor(page);
    await correctChapter(page);

    const underline = page.locator('.grammar-error', { hasText: 'chien' });
    await expect(underline).toBeVisible({ timeout: FIRST_UNDERLINE_TIMEOUT });
    await underline.click();

    // The nature is readable in words, not only by the underline colour.
    await expect(page.getByText('Accord', { exact: true })).toBeVisible();
    await expect(page.getByText(/devrait être au pluriel/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'chiens' })).toBeVisible();
  });

  test('the palette offers no dictionary action for a grammar issue', async ({ page }) => {
    await openGrammarEditor(page);
    await correctChapter(page);

    const underline = page.locator('.grammar-error', { hasText: 'chien' });
    await expect(underline).toBeVisible({ timeout: FIRST_UNDERLINE_TIMEOUT });
    await underline.click();

    await expect(page.getByRole('button', { name: 'Fermer' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Ajouter au dictionnaire' })
    ).not.toBeVisible();
  });

  test('applying a suggestion replaces the flagged range', async ({ page }) => {
    const editor = await openGrammarEditor(page);
    await correctChapter(page);

    const underline = page.locator('.grammar-error', { hasText: 'chien' });
    await expect(underline).toBeVisible({ timeout: FIRST_UNDERLINE_TIMEOUT });
    await underline.click();

    await page.getByRole('button', { name: 'chiens' }).click();

    await expect(editor).toContainText('Les chiens de la voisine sont partis.');
  });

  test('the underline of a corrected range disappears, the others stay', async ({ page }) => {
    await openGrammarEditor(page);
    await correctChapter(page);

    await expect(page.locator('.grammar-error')).toHaveCount(2, {
      timeout: FIRST_UNDERLINE_TIMEOUT,
    });

    await page.locator('.grammar-error', { hasText: 'chien' }).click();
    await page.getByRole('button', { name: 'chiens' }).click();

    await expect(page.locator('.grammar-error')).toHaveCount(1);
    await expect(page.locator('.grammar-error', { hasText: 'maison' })).toBeVisible();
  });

  test('underlines stay aligned when text is inserted before them', async ({ page }) => {
    const editor = await openGrammarEditor(page);
    await correctChapter(page);

    const underline = page.locator('.grammar-error', { hasText: 'chien' });
    await expect(underline).toBeVisible({ timeout: FIRST_UNDERLINE_TIMEOUT });

    await editor.click();
    await page.keyboard.press('Control+Home');
    await page.keyboard.type('Oh ');

    await underline.click();
    await page.getByRole('button', { name: 'chiens' }).click();

    await expect(editor).toContainText('Les chiens de la voisine sont partis.');
  });

  test('the correction has its own toolbar button, needing no AI provider', async ({
    page,
  }) => {
    await openGrammarEditor(page);

    const button = page.getByRole('button', { name: 'Corriger le chapitre' });
    await expect(button).toBeEnabled();
    await button.click();

    await expect(page.locator('.grammar-error').first()).toBeVisible({
      timeout: FIRST_UNDERLINE_TIMEOUT,
    });
  });

  test('declining a remark drops its underline and it stays gone', async ({ page }) => {
    await openGrammarEditor(page);
    await correctChapter(page);

    const underline = page.locator('.grammar-error', { hasText: 'chien' });
    await expect(underline).toBeVisible({ timeout: FIRST_UNDERLINE_TIMEOUT });
    await underline.click();

    await page.getByRole('button', { name: 'Ignorer dans ce projet' }).click();
    await expect(page.getByText(/ignoré dans ce projet/i)).toBeVisible();
    await expect(page.locator('.grammar-error', { hasText: 'chien' })).toHaveCount(0);

    // The other mistake is untouched: declining is not silencing the corrector.
    await expect(page.locator('.grammar-error', { hasText: 'maison' })).toBeVisible();

    // And the decision survives a fresh check.
    await correctChapter(page);
    await expect(page.locator('.grammar-error', { hasText: 'maison' })).toBeVisible({
      timeout: FIRST_UNDERLINE_TIMEOUT,
    });
    await expect(page.locator('.grammar-error', { hasText: 'chien' })).toHaveCount(0);
  });

  test('the punctuation option is offered beside the correction button', async ({ page }) => {
    await openGrammarEditor(page);

    await page.getByRole('button', { name: 'Options de correction' }).click();

    await expect(page.getByRole('switch', { name: 'Ponctuation' })).toBeVisible();
  });

  test('the local corrector is not filed under the AI menu', async ({ page }) => {
    await openGrammarEditor(page);

    await page.getByRole('button', { name: /^IA/i }).click();

    await expect(page.getByRole('menuitem', { name: 'Analyser le style' })).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Corriger le chapitre' })
    ).toHaveCount(0);
  });
});
