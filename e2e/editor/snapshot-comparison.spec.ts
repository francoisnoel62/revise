// ABOUTME: E2E for the read-only comparison of a saved snapshot and the persisted current state.
// ABOUTME: Covers frozen comparison messaging, changed structure, textual diff, and a rich block.

import { expect, test, type Page } from '@playwright/test';
import {
  TEST_RESTORE_DIVERGED_TEXT,
  TEST_RESTORE_ORIGINAL_TEXT,
  TEST_RESTORE_PROJECT_ID,
  resetRestoreFixture,
} from '../helpers/seed';

const EDITOR_URL = `/editor?project=${TEST_RESTORE_PROJECT_ID}`;

function getHistoryDialog(page: Page) {
  return page.getByRole('dialog').filter({ hasText: 'Historique des versions' });
}

test.describe('snapshot comparison — prévisualiser une version sans modifier le projet', () => {
  test.beforeEach(async () => {
    await resetRestoreFixture();
  });

  test('compares v1 with the persisted current state in a read-only dialog', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 15_000 });
    await page.locator('button[title="Historique des versions"]:visible').click();

    const history = getHistoryDialog(page);
    await expect(history.getByText('Version 1', { exact: true })).toBeVisible();
    await history.getByRole('button', { name: /prévisualiser et comparer/i }).click();

    const comparison = page.getByRole('dialog').filter({ hasText: 'Prévisualiser et comparer la version' });
    await expect(comparison.getByText(/lecture seule — le projet courant n’est pas édité/i)).toBeVisible();
    await expect(comparison.getByText(/état courant enregistré côté serveur, figé/i)).toBeVisible();
    await expect(comparison.getByText(/modifications locales non enregistrées ne sont pas incluses/i)).toBeVisible();
    await expect(comparison.getByText(TEST_RESTORE_ORIGINAL_TEXT, { exact: false })).toBeVisible();
    await expect(comparison.getByText(TEST_RESTORE_DIVERGED_TEXT, { exact: false })).toBeVisible();
    await expect(comparison.getByText(/blocs riches supprimés ou modifiés/i)).toBeVisible();
    await expect(comparison.locator('[contenteditable="true"]')).toHaveCount(0);
    await expect(comparison.getByRole('button', { name: /confirmer la restauration/i })).toHaveCount(0);

    // Merely opening and reading the comparison leaves the underlying live editor untouched.
    await expect(page.locator('.ProseMirror')).toContainText(TEST_RESTORE_DIVERGED_TEXT);
  });
});
