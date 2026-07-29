// ABOUTME: E2E for the automatic project snapshot path through a real editor session.
// ABOUTME: Opening an eligible project heartbeats the server clock and exposes the created version in history.

import { expect, test } from '@playwright/test';
import {
  TEST_AUTOMATIC_SNAPSHOT_PROJECT_ID,
  resetAutomaticSnapshotFixture,
} from '../helpers/seed';

test.describe('snapshots automatiques', () => {
  test.beforeEach(async () => {
    await resetAutomaticSnapshotFixture();
  });

  test('creates the due automatic snapshot when an editor session is open', async ({ page }) => {
    await page.goto(`/editor?project=${TEST_AUTOMATIC_SNAPSHOT_PROJECT_ID}`);
    await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 15_000 });

    await page.locator('button[title="Historique des versions"]:visible').click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Historique des versions' });

    await expect(dialog.getByText('Snapshot automatique')).toBeVisible({ timeout: 20_000 });
    await expect(dialog.getByText('Automatique', { exact: true })).toBeVisible();
    await expect(dialog.getByText('v1', { exact: true })).toBeVisible();
  });
});
