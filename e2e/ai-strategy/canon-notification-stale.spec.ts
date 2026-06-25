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
    // Intercepter uniquement l'action d'extraction (generateCanonFactsAction), pas
    // toutes les server actions. L'extraction reçoit (projectId, providerId) — son
    // corps contient donc le providerId, contrairement aux actions de fond
    // (checkCanonFreshnessAction, vérification orthographique) qui pourraient se
    // déclencher pendant la fenêtre d'annulation et fausser un compteur trop large.
    const extractionCalls: string[] = [];
    await page.route('**', async (route) => {
      const req = route.request();
      if (req.headers()['next-action'] && (req.postData() ?? '').includes(TEST_PROVIDER_ID)) {
        extractionCalls.push(req.url());
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

    const callCountBeforeCancel = extractionCalls.length;

    // Annuler — la dialog se ferme, aucun appel d'extraction déclenché
    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 3_000 });

    // Aucun appel d'extraction déclenché par l'annulation
    expect(extractionCalls.length).toBe(callCountBeforeCancel);
  });
});
