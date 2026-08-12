// ABOUTME: E2E for restoring a project snapshot without losing current state, against a real server.
// ABOUTME: Covers the safety-snapshot path, faithful chapter restore, provenance, and the conflict/reload prompt.

import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import {
  TEST_RESTORE_PROJECT_ID,
  TEST_RESTORE_ORIGINAL_TITLE,
  TEST_RESTORE_ORIGINAL_TEXT,
  TEST_RESTORE_DIVERGED_TITLE,
  resetRestoreFixture,
} from '../helpers/seed';

// Mirrors auth.setup.ts's AUTH_FILE — not imported directly to avoid re-running
// its top-level `setup(...)` registration as a side effect of the import.
const AUTH_FILE = path.join(__dirname, '..', '.auth', 'user.json');

const EDITOR_URL = `/editor?project=${TEST_RESTORE_PROJECT_ID}`;
const HISTORY_BUTTON_TITLE = 'Historique des versions';

// Both dialogs can be simultaneously present in the DOM (the confirmation nests inside the
// still-open history dialog), so scope by content rather than position (.first()/.last())
// to avoid depending on portal insertion order.
function getHistoryDialog(page: Page) {
  return page.getByRole('dialog').filter({ hasText: 'Historique des versions' });
}

function getConfirmDialog(page: Page) {
  return page.getByRole('dialog').filter({ hasText: 'Restaurer la version' });
}

async function openHistory(page: Page) {
  const editor = page.locator('.ProseMirror');
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await page.locator(`button[title="${HISTORY_BUTTON_TITLE}"]:visible`).click();
  return getHistoryDialog(page);
}

test.describe('snapshot restore — restaurer une version sans perdre l’état courant', () => {
  // Every test here resets and then mutates the same project fixture, so they must not
  // overlap: run in parallel, one test's reset wipes the snapshots another is asserting on.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await resetRestoreFixture();
  });

  test('restores v1, safety-snapshotting the diverged current state first', async ({ page }) => {
    await page.goto(EDITOR_URL);
    const dialog = await openHistory(page);

    // The live chapter has diverged from v1 (seeded), so the current-state banner shows.
    await expect(dialog.getByText('État courant')).toBeVisible();
    await expect(dialog.getByText(/modifications depuis la version 1/i)).toBeVisible();

    const v1Row = dialog.locator('text=Version 1').locator('..').locator('..');
    await v1Row.getByRole('button', { name: /restaurer/i }).click();

    const confirm = getConfirmDialog(page);
    await expect(confirm.getByText('Restaurer la version 1')).toBeVisible();
    await expect(confirm.getByText(/aucune version existante ne sera supprimée/i)).toBeVisible();
    // Unsnapshotted changes exist, so the confirmation must announce the safety snapshot.
    await expect(confirm.getByText(/sécurité avant restauration/i)).toBeVisible();
    // Structure comparison: current (diverged) title vs. the title that will come back.
    await expect(confirm.getByText(TEST_RESTORE_DIVERGED_TITLE)).toBeVisible();
    await expect(confirm.getByText(TEST_RESTORE_ORIGINAL_TITLE)).toBeVisible();

    await confirm.getByRole('button', { name: /confirmer la restauration/i }).click();
    // Generous timeout: restoreSnapshotAction's first invocation on a dev server
    // triggers Next.js's on-demand compile of its whole module graph (repositories,
    // use case, etc.) — a dev-mode-only cost, not real production latency.
    await expect(confirm).toBeHidden({ timeout: 30_000 });

    // v2 = safety snapshot of the diverged state, v3 = the restoration itself.
    await expect(dialog.getByText('v2', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText('v3', { exact: true })).toBeVisible();
    await expect(dialog.getByText(/restaurée depuis la version 1/i)).toBeVisible();
    // v1 is still there — restoring never deletes history.
    await expect(dialog.getByText('Version 1', { exact: true })).toBeVisible();
    await expect(dialog.getByText('v1', { exact: true })).toBeVisible();

    await page.keyboard.press('Escape');

    // The editor itself now shows the restored chapter, not the diverged one.
    await expect(page.locator('.ProseMirror')).toContainText(TEST_RESTORE_ORIGINAL_TEXT, { timeout: 10_000 });
  });

  test('surfaces a reload prompt on concurrent modification instead of silently overwriting', async ({ browser }) => {
    const contextA = await browser.newContext({ storageState: AUTH_FILE });
    const contextB = await browser.newContext({ storageState: AUTH_FILE });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      await pageA.goto(EDITOR_URL);
      const dialog = await openHistory(pageA);
      const v1Row = dialog.locator('text=Version 1').locator('..').locator('..');
      await v1Row.getByRole('button', { name: /restaurer/i }).click();
      const confirm = getConfirmDialog(pageA);
      await expect(confirm.getByText('Restaurer la version 1')).toBeVisible();

      // A concurrent session edits the same project while A's confirmation is open,
      // bumping the project's updatedAt on the server behind A's back.
      await pageB.goto(EDITOR_URL);
      await expect(pageB.locator('.ProseMirror')).toBeVisible({ timeout: 15_000 });
      await pageB.locator('.ProseMirror').click();
      await pageB.keyboard.type(' Modification concurrente.');
      // Fixed wait past the 1s autosave debounce, with margin for a cold dev-server
      // compile of updateChapterContentAction's module graph. UI-text and network-header
      // based wait conditions both proved unreliable here (the "saved" text is already
      // showing from the initial page load, and the "saving" flash can be too brief to
      // reliably catch; matching by Server Action headers caught unrelated in-flight
      // requests). A fixed margin is the pragmatic, working choice for this one step.
      await pageB.waitForTimeout(5_000);

      await confirm.getByRole('button', { name: /confirmer la restauration/i }).click();

      // Same generous timeout rationale as the direct-restore test above.
      await expect(confirm.getByText(/modifié entre-temps/i)).toBeVisible({ timeout: 30_000 });
      const reloadButton = confirm.getByRole('button', { name: /recharger le projet/i });
      await expect(reloadButton).toBeVisible();
      await reloadButton.click();

      // No crash, no silent overwrite: the confirmation closes and history is still usable.
      await expect(confirm).toBeHidden();
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
