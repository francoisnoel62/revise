// ABOUTME: E2E coverage for long-form generation deprecation in the primary UI
// ABOUTME: Verifies editor menus no longer expose chapter generation actions by default

import { test, expect } from '@playwright/test';
import { TEST_AUTOCOMPLETE_PROJECT_ID } from '../helpers/seed';
import { CHAPTER_GENERATION_TYPES } from '../../src/domain/value-objects/ChapterGenerationType';

const EDITOR_URL = `/editor?project=${TEST_AUTOCOMPLETE_PROJECT_ID}`;

const longFormLabels = [
  CHAPTER_GENERATION_TYPES['chapter-beginning'].name,
  CHAPTER_GENERATION_TYPES['chapter-full'].name,
  CHAPTER_GENERATION_TYPES['chapter-outline'].name,
];

test.describe('Génération longue déclassée — UI principale', () => {
  test('ne propose pas les actions de génération de chapitre dans l’éditeur', async ({ page }) => {
    await page.goto(EDITOR_URL);

    const editor = page.locator('.ProseMirror');
    await expect(editor).toBeVisible({ timeout: 15_000 });

    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');

    for (const label of longFormLabels) {
      await expect(page.getByText(label)).toHaveCount(0);
    }

    await page.getByRole('button', { name: /^IA/i }).click();
    for (const label of longFormLabels) {
      await expect(page.getByText(label)).toHaveCount(0);
    }

    await page.keyboard.press('Control+Shift+I');
    await page.getByPlaceholder(/rechercher une commande/i).fill('chapitre');
    for (const label of longFormLabels) {
      await expect(page.getByText(label)).toHaveCount(0);
    }
  });
});
