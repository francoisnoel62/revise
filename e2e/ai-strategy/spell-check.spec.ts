// ABOUTME: E2E tests for the dictionary-based spell-check feature in the TipTap editor
// ABOUTME: Covers: red underline appears after debounce, palette opens on click, correction is applied

import { test, expect, type Page } from '@playwright/test';
import {
  TEST_SPELLCHECK_PROJECT_ID,
  seedSpellCheckProject,
} from '../helpers/seed';

const EDITOR_URL = `/editor?project=${TEST_SPELLCHECK_PROJECT_ID}`;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function openSpellCheckEditor(page: Page) {
  await page.goto(EDITOR_URL);
  const editor = page.locator('.ProseMirror');
  await expect(editor).toBeVisible({ timeout: 15_000 });
  return editor;
}

/**
 * Positions the cursor at the end of the editor content and types a word.
 * Avoids Ctrl+A / select-all which would replace chapter text.
 */
async function typeAtEnd(page: Page, editor: ReturnType<typeof page.locator>, word: string) {
  await editor.click();
  await page.keyboard.press('Control+End');
  await page.keyboard.type(word);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Spell-check in the editor', () => {
  // These tests type into the same seeded chapter, which the editor autosaves back
  // to the DB. Run serially and re-seed the chapter before each test so a previously
  // typed misspelling can't accumulate and break the single-element locators.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await seedSpellCheckProject();
  });

  test('a misspelled word gets a red underline after the debounce', async ({ page }) => {
    const editor = await openSpellCheckEditor(page);

    // Type a known French misspelling
    await typeAtEnd(page, editor, ' maisson');

    // Budget: typing with slowMo=250 (~2s) + debounce (0.9s) + dict init on cold server (~3-5s).
    const spellerror = page.locator('.spell-error[data-spell-word="maisson"]');
    await expect(spellerror).toBeVisible({ timeout: 15_000 });
  });

  test('correctly spelled words do not receive a spell-error decoration', async ({ page }) => {
    const editor = await openSpellCheckEditor(page);

    // "maison" is a correctly spelled French word
    await typeAtEnd(page, editor, ' maison');

    // Wait long enough for debounce + server action (dict already warm after first test)
    await page.waitForTimeout(4_000);
    await expect(page.locator('.spell-error[data-spell-word="maison"]')).not.toBeVisible();
  });

  test('clicking a misspelled word opens the correction palette', async ({ page }) => {
    const editor = await openSpellCheckEditor(page);
    await typeAtEnd(page, editor, ' livrre');

    const spellerror = page.locator('.spell-error[data-spell-word="livrre"]');
    await expect(spellerror).toBeVisible({ timeout: 15_000 });

    await spellerror.click();

    // The palette header contains the misspelled word and "Corrections :"
    await expect(page.locator('.line-through').filter({ hasText: 'livrre' })).toBeVisible();
    await expect(page.getByText('Corrections :')).toBeVisible();
    // The "Ignorer" button is always present
    await expect(page.getByRole('button', { name: 'Ignorer' })).toBeVisible();
  });

  test('clicking a suggestion replaces the misspelled word in the editor', async ({ page }) => {
    const editor = await openSpellCheckEditor(page);
    await typeAtEnd(page, editor, ' maisson');

    const spellerror = page.locator('.spell-error[data-spell-word="maisson"]');
    await expect(spellerror).toBeVisible({ timeout: 15_000 });
    await spellerror.click();

    // "maison" should appear among the suggestion buttons
    const suggestionBtn = page.getByRole('button', { name: 'maison' });
    await expect(suggestionBtn).toBeVisible();
    await suggestionBtn.click();

    // The word is replaced — editor text now contains "maison", not "maisson"
    await expect(editor).toContainText('maison');
    await expect(editor).not.toContainText('maisson');
  });

  test('clicking Ignorer closes the palette without changing the text', async ({ page }) => {
    const editor = await openSpellCheckEditor(page);
    await typeAtEnd(page, editor, ' maisson');

    const spellerror = page.locator('.spell-error[data-spell-word="maisson"]');
    await expect(spellerror).toBeVisible({ timeout: 15_000 });
    await spellerror.click();

    await expect(page.getByRole('button', { name: 'Ignorer' })).toBeVisible();
    await page.getByRole('button', { name: 'Ignorer' }).click();

    // Palette is gone
    await expect(page.getByRole('button', { name: 'Ignorer' })).not.toBeVisible();
    // Misspelled word is still in the editor unchanged
    await expect(editor).toContainText('maisson');
  });

  test('the palette closes when clicking outside of it', async ({ page }) => {
    const editor = await openSpellCheckEditor(page);
    await typeAtEnd(page, editor, ' maisson');

    const spellerror = page.locator('.spell-error[data-spell-word="maisson"]');
    await expect(spellerror).toBeVisible({ timeout: 15_000 });
    await spellerror.click();

    await expect(page.getByRole('button', { name: 'Ignorer' })).toBeVisible();

    // Click somewhere outside the palette (top-left corner of the page)
    await page.mouse.click(10, 10);

    await expect(page.getByRole('button', { name: 'Ignorer' })).not.toBeVisible();
  });

  test('uppercase-initial words (proper nouns / place names) are not underlined', async ({ page }) => {
    const editor = await openSpellCheckEditor(page);

    // Fantasy / sci-fi proper nouns not in any dictionary
    await typeAtEnd(page, editor, ' Arrakis Khaleesi Gandalf');

    // Wait long enough for debounce + server action
    await page.waitForTimeout(4_000);

    await expect(page.locator('.spell-error[data-spell-word="Arrakis"]')).not.toBeVisible();
    await expect(page.locator('.spell-error[data-spell-word="Khaleesi"]')).not.toBeVisible();
    await expect(page.locator('.spell-error[data-spell-word="Gandalf"]')).not.toBeVisible();
  });

  test('clicking Ignorer removes the underline and it does not reappear on re-check', async ({ page }) => {
    const editor = await openSpellCheckEditor(page);
    await typeAtEnd(page, editor, ' maisson');

    const spellerror = page.locator('.spell-error[data-spell-word="maisson"]');
    await expect(spellerror).toBeVisible({ timeout: 15_000 });
    await spellerror.click();

    await page.getByRole('button', { name: 'Ignorer' }).click();

    // Underline is gone
    await expect(spellerror).not.toBeVisible();

    // Type something to trigger a new spell-check run
    await typeAtEnd(page, editor, ' monde');
    await page.waitForTimeout(4_000);

    // The previously ignored word must stay undecorated
    await expect(page.locator('.spell-error[data-spell-word="maisson"]')).not.toBeVisible();
  });

  test('the palette shows an "Ajouter au dictionnaire" button', async ({ page }) => {
    const editor = await openSpellCheckEditor(page);
    await typeAtEnd(page, editor, ' livrre');

    const spellerror = page.locator('.spell-error[data-spell-word="livrre"]');
    await expect(spellerror).toBeVisible({ timeout: 15_000 });
    await spellerror.click();

    await expect(page.getByRole('button', { name: 'Ajouter au dictionnaire' })).toBeVisible();
  });

  test('adding a word to the dictionary removes its underline immediately', async ({ page }) => {
    const editor = await openSpellCheckEditor(page);
    await typeAtEnd(page, editor, ' spicce');

    const spellerror = page.locator('.spell-error[data-spell-word="spicce"]');
    await expect(spellerror).toBeVisible({ timeout: 15_000 });
    await spellerror.click();

    await page.getByRole('button', { name: 'Ajouter au dictionnaire' }).click();

    // Underline is gone immediately
    await expect(spellerror).not.toBeVisible();
  });
});
