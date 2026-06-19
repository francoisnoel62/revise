// ABOUTME: E2E — Flux notification "canon périmé" (#112, #114)
// ABOUTME: Vérifie que la cloche affiche le badge quand le canon est périmé et que l'action de confirmation fonctionne

import { test, expect } from '@playwright/test';
import {
  TEST_CANON_STALE_PROJECT_ID,
  TEST_PROVIDER_ID,
} from '../helpers/seed';

const EDITOR_URL = `/editor?project=${TEST_CANON_STALE_PROJECT_ID}`;

test.describe('Canon périmé — notification actionnable dans la cloche (#112, #114)', () => {
  test('Scénario A — la cloche affiche un badge quand le canon est périmé', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 15_000 });

    // checkCanonFreshnessAction détecte le hash périmé et pousse une notification
    // Le badge apparaît dès que notificationStore reçoit la notification
    await expect(
      page.getByRole('button', { name: /notifications.*non lue/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Scénario B — cliquer sur la cloche révèle la notification "Faits canon périmés"', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 15_000 });

    // Attendre que la notification apparaisse
    const bell = page.getByRole('button', { name: /notifications/i }).first();
    await expect(bell).toBeVisible({ timeout: 10_000 });

    // Ouvrir le popover
    await bell.click();

    await expect(page.getByText('Faits canon périmés')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Le manuscrit a été modifié')).toBeVisible();

    // Le bouton d'action "Régénérer" est présent dans la liste
    await expect(page.getByRole('button', { name: 'Régénérer' }).first()).toBeVisible();
  });

  test('Scénario C — cliquer Régénérer ouvre la dialog de confirmation', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 15_000 });

    const bell = page.getByRole('button', { name: /notifications/i }).first();
    await expect(bell).toBeVisible({ timeout: 10_000 });
    await bell.click();

    await expect(page.getByText('Faits canon périmés')).toBeVisible({ timeout: 5_000 });

    // Cliquer le bouton Régénérer dans la notification
    await page.getByRole('button', { name: 'Régénérer' }).first().click();

    // La dialog de confirmation doit s'ouvrir
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("L'extraction incrémentale sera relancée")).toBeVisible();

    // Vérifier que les deux boutons de la dialog existent
    await expect(page.getByRole('button', { name: 'Annuler' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Régénérer' }).last()).toBeVisible();
  });

  test('Scénario D — annuler ferme la dialog sans déclencher l\'extraction', async ({ page }) => {
    // Intercepter les appels canon pour vérifier qu'aucun n'est lancé
    const canonCalls: string[] = [];
    await page.route('**', async (route) => {
      const req = route.request();
      if (req.headers()['next-action']) {
        canonCalls.push(req.url());
      }
      await route.continue();
    });

    await page.goto(EDITOR_URL);
    await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 15_000 });

    const bell = page.getByRole('button', { name: /notifications/i }).first();
    await expect(bell).toBeVisible({ timeout: 10_000 });
    await bell.click();

    await expect(page.getByText('Faits canon périmés')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: 'Régénérer' }).first().click();
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5_000 });

    const callCountBeforeCancel = canonCalls.length;

    // Annuler — la dialog se ferme, aucun appel supplémentaire de génération
    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 3_000 });

    // Aucun appel server action supplémentaire déclenché par l'annulation
    expect(canonCalls.length).toBe(callCountBeforeCancel);
  });
});
