// ABOUTME: E2E — Déclencheur de fin de session (#113)
// ABOUTME: Vérifie que l'inactivité pendant 15-30 min provoque l'extraction et une notification

import { test, expect } from '@playwright/test';
import {
  TEST_CANON_SESSION_PROJECT_ID,
} from '../helpers/seed';

const EDITOR_URL = `/editor?project=${TEST_CANON_SESSION_PROJECT_ID}`;

// Advance past INACTIVITY_THRESHOLD_MAX_MS (30 min) to be safe with the randomized range
const FAST_FORWARD_MS = 31 * 60 * 1000;

test.describe('Déclencheur de fin de session (#113)', () => {
  test('Une notification apparaît dans la cloche après 30 min d\'inactivité en mode session-end', async ({ page }) => {
    // Install fake timers BEFORE navigation so the hook's setTimeout is under our control
    await page.clock.install();

    await page.goto(EDITOR_URL);
    await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 15_000 });

    // Wait for project settings to load — the hook ignores activity while mode is still 'manual'
    await expect(
      page.locator('[data-testid="canon-mode-indicator"][data-canon-mode="session-end"]')
    ).toBeAttached({ timeout: 10_000 });

    // Verify the editor loaded correctly (session-end mode is set in project settings)
    const editor = page.locator('.ProseMirror');

    // Simulate a keydown to start the session — the hook only starts the timer after first activity
    await editor.click();
    await page.keyboard.press('a');

    // Fast-forward past the maximum inactivity threshold (30 min + 1 min margin)
    await page.clock.fastForward(FAST_FORWARD_MS);

    // After clock advance, the hook fires generateCanonFactsAction.
    // The extraction will either succeed or fail (fake LLM key) — either way
    // a notification (canon-done or canon-error) ends up in notificationStore.
    // Wait for the bell badge to appear, proving the full trigger → notification flow.
    await expect(
      page.getByRole('button', { name: /notifications.*non lue/i })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Aucune notification n\'apparaît sans activité préalable (compteur ne démarre pas)', async ({ page }) => {
    await page.clock.install();

    await page.goto(EDITOR_URL);
    await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 15_000 });

    // Do NOT simulate any keydown — the hook should not start its timer
    await page.clock.fastForward(FAST_FORWARD_MS);

    // Bell should remain empty (no badge)
    // The button exists but its aria-label should NOT contain "non lue"
    const bell = page.getByRole('button', { name: /^notifications$/i });
    // If the bell with "non lues" appears within 3s, the test fails
    await expect(
      page.getByRole('button', { name: /notifications.*non lue/i })
    ).not.toBeVisible({ timeout: 3_000 });

    // The plain bell (no badge) should still be present
    await expect(bell).toBeVisible();
  });
});
