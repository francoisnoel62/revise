// ABOUTME: E2E for the author journey declaring an invented word's nature, gender and plural.
// ABOUTME: Covers: the settings row, the declaration surviving a reload, and the corrector using it.

import { test, expect, type Page } from '@playwright/test';
import {
  TEST_DICTIONARY_CHAPTER_ID,
  TEST_DICTIONARY_PROJECT_ID,
  TEST_DICTIONARY_WORD,
  seedDictionaryProject,
} from '../helpers/seed';

const SETTINGS_URL = `/project/${TEST_DICTIONARY_PROJECT_ID}/cockpit/settings`;
const EDITOR_URL = `/editor?project=${TEST_DICTIONARY_PROJECT_ID}&chapter=${TEST_DICTIONARY_CHAPTER_ID}`;

// The server loads the grammar engine's rules and dictionaries (~25 MB) the first
// time a chapter is checked; that one-off cost dominates the first assertion.
const FIRST_UNDERLINE_TIMEOUT = 120_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function openSettings(page: Page) {
  await page.goto(SETTINGS_URL);
  await expect(page.getByText('Dictionnaire personnalisé')).toBeVisible({ timeout: 15_000 });
}

/** Declares the seeded word a feminine proper noun and waits for the save. */
async function declareFeminineProperNoun(page: Page) {
  const save = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.status() < 400
  );
  await page
    .getByLabel(`Nature de ${TEST_DICTIONARY_WORD}`)
    .selectOption('proper-noun');
  await save;

  const secondSave = page.waitForResponse(
    (response) => response.request().method() === 'POST' && response.status() < 400
  );
  await page.getByLabel(`Genre de ${TEST_DICTIONARY_WORD}`).selectOption('feminine');
  await secondSave;
}

async function correctChapter(page: Page) {
  await page.keyboard.press('Control+Shift+I');
  const entry = page.getByText('Corriger le chapitre');
  await expect(entry).toBeVisible({ timeout: 10_000 });
  await entry.click();
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe("A project's own vocabulary", () => {
  // Declaring a word rewrites the settings document, so each test restarts from
  // the undeclared state. The timeout covers the engine's cold start.
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  test.beforeEach(async () => {
    await seedDictionaryProject();
  });

  test('a word stored before declarations existed is still listed', async ({ page }) => {
    await openSettings(page);

    await expect(page.getByText(TEST_DICTIONARY_WORD, { exact: true })).toBeVisible();
    await expect(page.getByLabel(`Nature de ${TEST_DICTIONARY_WORD}`)).toHaveValue('');
    await expect(page.getByLabel(`Genre de ${TEST_DICTIONARY_WORD}`)).toHaveValue('');
  });

  test('the nature and gender the author picks survive a reload', async ({ page }) => {
    await openSettings(page);
    await declareFeminineProperNoun(page);

    await page.reload();

    await expect(page.getByLabel(`Nature de ${TEST_DICTIONARY_WORD}`)).toHaveValue(
      'proper-noun',
      { timeout: 15_000 }
    );
    await expect(page.getByLabel(`Genre de ${TEST_DICTIONARY_WORD}`)).toHaveValue('feminine');
  });

  test('an undeclared word draws no comment from the corrector', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 15_000 });
    await correctChapter(page);

    // The chapter's ordinary mistake proves the check ran, so the silence about
    // Vhardun below is an answer rather than an answer still coming.
    await expect(page.locator('.grammar-error', { hasText: 'chien' })).toBeVisible({
      timeout: FIRST_UNDERLINE_TIMEOUT,
    });
    await expect(page.locator('.grammar-error')).toHaveCount(1);
  });

  test('once declared feminine, the corrector asks for the agreement', async ({ page }) => {
    await openSettings(page);
    await declareFeminineProperNoun(page);

    await page.goto(EDITOR_URL);
    await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 15_000 });
    await correctChapter(page);

    await expect(page.locator('.grammar-error')).toHaveCount(2, {
      timeout: FIRST_UNDERLINE_TIMEOUT,
    });

    const underline = page.locator('.grammar-error', { hasText: 'parti' });
    await underline.click();
    await expect(page.getByRole('button', { name: 'partie' })).toBeVisible();
  });
});
