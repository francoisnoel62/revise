// ABOUTME: E2E for manual project snapshots — full create-then-consult journey against a real server.
// ABOUTME: Covers sequential numbering, an editorial milestone with no changes, and persistence across reload.

import { test, expect } from '@playwright/test';
import { TEST_SNAPSHOT_PROJECT_ID, resetSnapshotFixture } from '../helpers/seed';

const EDITOR_URL = `/editor?project=${TEST_SNAPSHOT_PROJECT_ID}`;
const HISTORY_BUTTON_TITLE = 'Historique des versions';

test.describe('manual snapshots — create and consult', () => {
  // Re-seed the chapter content and clear any snapshots/counters left over from a
  // previous run, so the absolute v1/v2 assertions below stay valid across re-runs.
  test.beforeEach(async () => {
    await resetSnapshotFixture();
  });

  test('creates numbered snapshots and lists them, persisting across reload', async ({ page }) => {
    await page.goto(EDITOR_URL);

    const editor = page.locator('.ProseMirror');
    await expect(editor).toBeVisible({ timeout: 15_000 });

    const historyButton = page.locator(`button[title="${HISTORY_BUTTON_TITLE}"]:visible`);
    await historyButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Historique des versions')).toBeVisible();
    await expect(dialog.getByText('État courant')).toBeVisible();
    await expect(dialog.getByText('Aucun snapshot pour ce projet').first()).toBeVisible();

    // Create the first manual snapshot.
    await dialog.getByLabel('Titre').fill('Version E2E 1');
    await dialog.getByLabel(/commentaire/i).fill('Premier jalon e2e');
    await dialog.getByRole('button', { name: /créer un snapshot/i }).click();

    await expect(dialog.getByText('Version E2E 1')).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText('Premier jalon e2e')).toBeVisible();
    await expect(dialog.getByText('v1')).toBeVisible();
    // The current state now matches the snapshot just taken — no drift left to report.
    await expect(dialog.getByText('État courant')).toHaveCount(0);

    // A second manual snapshot with no further changes marks an editorial milestone —
    // created using the prefilled title, with no manual edit needed this time.
    await expect(dialog.getByLabel('Titre')).toHaveValue('Version 2');
    await dialog.getByRole('button', { name: /créer un snapshot/i }).click();
    await expect(dialog.getByText('v2')).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText('Version 2')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    // Reload: the snapshot history was read back from MongoDB through a fresh page load,
    // via a real authenticated round trip (not a mocked action).
    await page.reload();
    await page.locator(`button[title="${HISTORY_BUTTON_TITLE}"]:visible`).click();

    const reopenedDialog = page.getByRole('dialog');
    await expect(reopenedDialog.getByText('Version E2E 1')).toBeVisible({ timeout: 10_000 });
    await expect(reopenedDialog.getByText('Premier jalon e2e')).toBeVisible();
    await expect(reopenedDialog.getByText('Version 2')).toBeVisible();
    await expect(reopenedDialog.getByText('v1')).toBeVisible();
    await expect(reopenedDialog.getByText('v2')).toBeVisible();
  });

  test('edits metadata, confirms irreversible deletion, and keeps a non-openable audit entry', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 15_000 });
    await page.locator(`button[title="${HISTORY_BUTTON_TITLE}"]:visible`).click();
    const history = page.getByRole('dialog').filter({ hasText: 'Historique des versions' });

    await history.getByLabel('Titre').fill('Version à gouverner');
    await history.getByRole('button', { name: /créer un snapshot/i }).click();
    await expect(history.getByText('Version à gouverner')).toBeVisible({ timeout: 10_000 });

    await history.getByRole('button', { name: 'Modifier' }).click();
    const edit = page.getByRole('dialog').filter({ hasText: 'Modifier le snapshot' });
    await edit.getByLabel('Titre').fill('Version renommée');
    await edit.getByLabel('Commentaire').fill('Métadonnée e2e');
    await edit.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(history.getByText('Version renommée')).toBeVisible();
    await expect(history.getByText('Métadonnée e2e')).toBeVisible();

    await history.getByRole('button', { name: 'Supprimer' }).click();
    const confirm = page.getByRole('dialog').filter({ hasText: 'Supprimer définitivement ce snapshot' });
    await expect(confirm.getByText(/ne pourra plus être prévisualisé ni restauré/i)).toBeVisible();
    await confirm.getByRole('button', { name: 'Confirmer la suppression' }).click();

    await expect(history.getByText('Supprimée')).toBeVisible();
    await expect(history.getByText(/contenu a été supprimé définitivement/i)).toBeVisible();
    await expect(history.getByRole('button', { name: 'Restaurer' })).toHaveCount(0);
    await expect(history.getByRole('button', { name: 'Prévisualiser et comparer' })).toHaveCount(0);
  });
});
