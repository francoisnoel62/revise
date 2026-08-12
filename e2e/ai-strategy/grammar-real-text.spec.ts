// ABOUTME: E2E for "Corriger le chapitre" on a full page of real, deliberately faulty prose.
// ABOUTME: Measures recall against the author's own list of mistakes, on long literary sentences.

import { test, expect, type Page } from '@playwright/test';
import { TEST_HIROSHIMA_PROJECT_ID, seedHiroshimaProject } from '../helpers/seed';
import { HIROSHIMA_KNOWN_MISTAKES } from '../helpers/hiroshima-corpus';

const EDITOR_URL = `/editor?project=${TEST_HIROSHIMA_PROJECT_ID}`;

// The server loads the engine's rules and dictionaries (~25 MB) on the first check of the
// run, and this chapter is a full page rather than two sentences.
const FIRST_CHECK_TIMEOUT = 150_000;

// Floors, not targets. Measured in the editor at 99 underlines covering 66 of the 98 known
// mistakes (the engine itself reports 67 — the overlap heuristic below loses one). Set below
// the measurement so ordinary rule-set drift does not turn the suite red, while a real
// collapse in recall still does. Raise them when the corrector improves.
const MIN_FLAGGED_RANGES = 70;
const MIN_KNOWN_MISTAKES_CAUGHT = 55;

// An underline covers the flagged words, not the whole faulty fragment: "chaque jours" is
// underlined as "jours". A mistake counts as caught when some underline sits inside its
// fragment. Short runs are ignored — "des" would otherwise match half the corpus.
const MIN_MATCHABLE_LENGTH = 4;

async function openEditor(page: Page) {
  await page.goto(EDITOR_URL);
  const editor = page.locator('.ProseMirror');
  await expect(editor).toBeVisible({ timeout: 15_000 });
  return editor;
}

async function correctChapter(page: Page) {
  await page.getByRole('button', { name: 'Corriger le chapitre' }).click();
  await expect(page.locator('.grammar-error').first()).toBeVisible({
    timeout: FIRST_CHECK_TIMEOUT,
  });
}

function countKnownMistakesCaught(underlines: readonly string[]): string[] {
  const usable = underlines
    .map((text) => text.trim())
    .filter((text) => text.length >= MIN_MATCHABLE_LENGTH);

  return HIROSHIMA_KNOWN_MISTAKES.filter((mistake) =>
    usable.some((underline) => mistake.wrong.includes(underline)),
  ).map((mistake) => mistake.wrong);
}

test.describe('Grammar correction on a real page of prose', () => {
  // One chapter, checked and edited by several tests; the engine's cold start is paid once.
  test.describe.configure({ mode: 'serial', timeout: 240_000 });

  test.beforeEach(async () => {
    await seedHiroshimaProject();
  });

  test('raises no remark until the author asks', async ({ page }) => {
    await openEditor(page);

    await page.waitForTimeout(4_000);
    await expect(page.locator('.grammar-error')).toHaveCount(0);
  });

  test('catches most of the mistakes the author knows about', async ({ page }) => {
    await openEditor(page);
    await correctChapter(page);

    const underlines = await page.locator('.grammar-error').allInnerTexts();
    expect(underlines.length).toBeGreaterThanOrEqual(MIN_FLAGGED_RANGES);

    const caught = countKnownMistakesCaught(underlines);
    expect(caught.length).toBeGreaterThanOrEqual(MIN_KNOWN_MISTAKES_CAUGHT);
  });

  test('flags agreement across a long noun phrase, not only inside short sentences', async ({
    page,
  }) => {
    await openEditor(page);
    await correctChapter(page);

    // Each of these sits deep inside a long sentence, far from its governing word — the
    // case a corrector working sentence-by-sentence would miss.
    await expect(page.locator('.grammar-error', { hasText: 'paradoxale' })).toBeVisible();
    await expect(page.locator('.grammar-error', { hasText: 'stigmate' })).toBeVisible();
    await expect(page.locator('.grammar-error', { hasText: 'dépassais' })).toBeVisible();
  });

  test('names the category and applies a correction inside a long paragraph', async ({
    page,
  }) => {
    const editor = await openEditor(page);
    await correctChapter(page);

    await page.locator('.grammar-error', { hasText: 'stigmate' }).click();

    await expect(page.getByText('Accord', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'stigmates' }).click();

    await expect(editor).toContainText('les stigmates de notre triomphe technologique');
  });
});
