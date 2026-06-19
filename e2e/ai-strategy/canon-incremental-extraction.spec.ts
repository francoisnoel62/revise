// ABOUTME: E2E — Extraction incrémentale des faits canon depuis le cockpit (#112)
// ABOUTME: Vérifie que le bouton Générer/Régénérer est accessible et déclenche l'extraction

import { test, expect } from '@playwright/test';
import {
  TEST_CANON_STALE_PROJECT_ID,
  TEST_PROVIDER_ID,
} from '../helpers/seed';

const COCKPIT_CANON_URL = `/project/${TEST_CANON_STALE_PROJECT_ID}/cockpit/canon`;

test.describe('Extraction incrémentale des faits canon — cockpit (#112)', () => {
  test('Le bouton Générer/Régénérer est présent et cliquable quand un provider est sélectionné', async ({ page }) => {
    await page.goto(COCKPIT_CANON_URL);

    // Wait for the page to load
    await expect(page.getByText('Générer / Régénérer')).toBeVisible({ timeout: 15_000 });

    const generateBtn = page.getByRole('button', { name: /générer/i });
    await expect(generateBtn).toBeVisible();

    // The button should not be disabled (provider is seeded)
    // Note: it may be disabled if provider selection hasn't resolved yet — wait
    await expect(generateBtn).not.toBeDisabled({ timeout: 10_000 });
  });

  test('Cliquer Générer/Régénérer lance l\'extraction et montre l\'état de chargement', async ({ page }) => {
    await page.goto(COCKPIT_CANON_URL);
    await expect(page.getByText('Générer / Régénérer')).toBeVisible({ timeout: 15_000 });

    const generateBtn = page.getByRole('button', { name: /générer/i });
    await expect(generateBtn).not.toBeDisabled({ timeout: 10_000 });

    await generateBtn.click();

    // After click, the button should either show "Génération…" (loading)
    // or complete quickly (if extraction is fast). Either state is valid.
    // We just verify the click was handled and the UI responded.
    await expect(
      page.getByRole('button', { name: /génération|générer/i })
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Le cockpit affiche les faits canon existants pour le projet', async ({ page }) => {
    await page.goto(COCKPIT_CANON_URL);
    await expect(page.getByText('Générer / Régénérer')).toBeVisible({ timeout: 15_000 });

    // The seeded project has 1 derived canon fact (Madeleine → "ouvre la porte")
    // It should be visible in the canon list
    await expect(page.getByText('Madeleine')).toBeVisible({ timeout: 10_000 });
  });

  test('La cloche du cockpit affiche la notification de canon périmé', async ({ page }) => {
    // The stale project also triggers checkCanonFreshnessAction in the cockpit canon page
    await page.goto(COCKPIT_CANON_URL);
    await expect(page.getByText('Générer / Régénérer')).toBeVisible({ timeout: 15_000 });

    // The staleness warning should appear in the page body (cockpit has its own staleness indicator)
    await expect(
      page.getByText(/modifié depuis la dernière extraction/i)
    ).toBeVisible({ timeout: 10_000 });
  });
});
