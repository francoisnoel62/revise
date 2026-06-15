// ABOUTME: E2E coverage for cockpit autocomplete metrics
// ABOUTME: Verifies seeded autocomplete telemetry is visible on the usage dashboard

import { test, expect } from '@playwright/test';
import { TEST_AUTOCOMPLETE_PROJECT_ID } from '../helpers/seed';

const USAGE_URL = `/project/${TEST_AUTOCOMPLETE_PROJECT_ID}/cockpit/usage`;

test.describe('Cockpit — métriques d’autocomplétion', () => {
  test('affiche les métriques agrégées des suggestions seedées', async ({ page }) => {
    await page.goto(USAGE_URL);

    const card = page.getByTestId('autocomplete-stats-card');
    await expect(card).toBeVisible({ timeout: 15_000 });

    await expect(card.getByText('Autocomplétion')).toBeVisible();
    await expect(card.getByText('Suggestions')).toBeVisible();
    await expect(card.getByText('6')).toBeVisible();
    await expect(card.getByText(/33\s*%/)).toBeVisible();
    await expect(card.getByText(/17\s*%/)).toBeVisible();
    await expect(card.getByText(/50\s*%/)).toBeVisible();
    await expect(card.getByText('300 ms')).toBeVisible();
    await expect(card.getByText('480 ms')).toBeVisible();
    await expect(card.getByText('Réponses vides')).toBeVisible();
  });
});
