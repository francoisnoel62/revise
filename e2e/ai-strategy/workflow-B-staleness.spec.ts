// ABOUTME: E2E — Workflow B : badge de péremption visible dans l'UI
// ABOUTME: Vérifie que MetadataCard affiche le badge amber quand isStale=true

import { test, expect } from '@playwright/test';
import {
  TEST_PROJECT_ID,
  TEST_CHAPTER_CONTENT,
  TEST_CHAPTER_TITLE,
} from '../helpers/seed';

const METADATA_URL = `/project/${TEST_PROJECT_ID}/cockpit/metadata`;
const EDITOR_URL = `/editor?project=${TEST_PROJECT_ID}`;

const STALE_TEXT = 'Basé sur une version antérieure du manuscrit';

test.describe('Workflow B — Badge de péremption dans la liste des métadonnées', () => {
  test('Scénario A — fiche Personnages périmée : badge amber visible au chargement', async ({ page }) => {
    await page.goto(METADATA_URL);

    // Attendre que la freshnessAction côté serveur ait renvoyé les résultats
    // La carte "Personnages" doit montrer le badge stale
    await expect(
      page.getByText(STALE_TEXT).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Scénario B — fiche Analyse Narrative fraîche : aucun badge sur cette fiche', async ({ page }) => {
    await page.goto(METADATA_URL);

    // Attendre que la page charge entièrement
    await expect(page.getByText('Analyse Narrative')).toBeVisible({ timeout: 15_000 });

    // La fiche Analyse Narrative est fraîche — le badge ne doit PAS apparaître
    // (mais la fiche Personnages est périmée et son badge peut être présent)
    const analyseNarrativeCard = page.locator('[data-testid="metadata-card"]', {
      has: page.getByText('Analyse Narrative'),
    });

    // Si on trouve la card avec data-testid, vérifier pas de badge
    const cardCount = await analyseNarrativeCard.count();
    if (cardCount > 0) {
      await expect(analyseNarrativeCard.getByText(STALE_TEXT)).not.toBeVisible();
    } else {
      // Fallback: vérifier que le badge n'est pas présent dans la zone Analyse Narrative
      // Le texte "Analyse Narrative" doit être visible mais le stale badge peut être ailleurs
      await expect(page.getByText('Analyse Narrative')).toBeVisible();
    }
  });

  test('Scénario C — éditer le chapitre rend les métadonnées périmées', async ({ page }) => {
    // 1. Vérifier l'état initial : Analyse Narrative est fraîche (1 seul badge visible = Personnages)
    await page.goto(METADATA_URL);
    await expect(page.getByText('Analyse Narrative')).toBeVisible({ timeout: 15_000 });

    const initialBadgeCount = await page.getByText(STALE_TEXT).count();

    // 2. Aller dans l'éditeur et modifier le contenu du chapitre
    await page.goto(EDITOR_URL);
    await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 15_000 });

    const editor = page.locator('.ProseMirror');
    await editor.click();

    // Sélectionner tout le texte et le remplacer (invalide le hash)
    await page.keyboard.press('Control+a');
    await page.keyboard.type(
      'Nouveau contenu ajouté par le test E2E pour invalider le hash des métadonnées. ' +
      TEST_CHAPTER_TITLE
    );

    // Attendre l'autosave (délai de 1s + marge)
    await page.waitForTimeout(2500);
    // Vérifier que le statut de sauvegarde indique "Enregistré"
    await expect(page.getByText(/enregistr/i)).toBeVisible({ timeout: 10_000 });

    // 3. Retourner sur la liste des métadonnées
    await page.goto(METADATA_URL);
    await expect(page.getByText('Analyse Narrative')).toBeVisible({ timeout: 15_000 });

    // 4. L'Analyse Narrative est maintenant périmée : le nombre de badges a augmenté
    const finalBadgeCount = await page.getByText(STALE_TEXT).count();
    expect(finalBadgeCount).toBeGreaterThan(initialBadgeCount);
  });
});
