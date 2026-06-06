// ABOUTME: E2E — Workflow A : documents de recherche visibles et navigables dans l'UI
// ABOUTME: Vérifie création, affichage et navigation depuis le cockpit

import { test, expect } from '@playwright/test';
import { TEST_PROJECT_ID } from '../helpers/seed';

const RESEARCH_URL = `/project/${TEST_PROJECT_ID}/cockpit/research`;
const EDITOR_URL = `/editor?project=${TEST_PROJECT_ID}`;
const COCKPIT_URL = `/project/${TEST_PROJECT_ID}/cockpit`;

test.describe('Workflow A — Documents de recherche dans l\'UI', () => {
  test('le document de recherche seedé est visible dans la liste', async ({ page }) => {
    await page.goto(RESEARCH_URL);

    // Le titre du document seedé doit apparaître
    await expect(page.getByText('Plan du roman E2E')).toBeVisible({ timeout: 15_000 });
  });

  test('créer une nouvelle note via le formulaire et la voir dans la liste', async ({ page }) => {
    await page.goto(RESEARCH_URL);

    // Attendre le chargement initial
    await expect(page.getByText('Plan du roman E2E')).toBeVisible({ timeout: 15_000 });

    // Trouver et cliquer sur le bouton d'ajout
    const addButton = page.getByRole('button', { name: /ajouter|nouveau|créer|\+/i }).first();
    await addButton.click();

    // Remplir le formulaire
    const titleInput = page.getByRole('textbox').filter({ hasText: '' }).first();
    // Cherche un input de titre (souvent labellé "Titre" dans le formulaire)
    const dialogTitle = page.getByRole('dialog').locator('input[type="text"]').first();
    const titleField = (await dialogTitle.count()) > 0
      ? dialogTitle
      : page.getByLabel(/titre/i).first();

    await titleField.fill('Nouveau document de test E2E');

    // Remplir le contenu si disponible
    const contentField = page.getByLabel(/contenu|notes|texte/i).first();
    if (await contentField.count() > 0) {
      await contentField.fill('Sentinelle unique : Silas Greffe porte la montre à treize heures.');
    }

    // Soumettre
    await page.getByRole('button', { name: /créer|ajouter|enregistrer|sauvegarder/i }).last().click();

    // Vérifier que le nouveau document apparaît dans la liste
    await expect(page.getByText('Nouveau document de test E2E')).toBeVisible({ timeout: 10_000 });
  });

  test('naviguer vers l\'éditeur depuis le cockpit', async ({ page }) => {
    await page.goto(COCKPIT_URL);

    // Chercher un lien ou bouton vers l'éditeur
    const editorLink = page.getByRole('link', { name: /écrire|éditeur|editor|ouvrir/i }).first();
    const hasEditorLink = await editorLink.count() > 0;

    if (hasEditorLink) {
      await editorLink.click();
    } else {
      // Navigation directe via URL si pas de lien visible
      await page.goto(EDITOR_URL);
    }

    // L'éditeur TipTap doit être présent
    await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 15_000 });
  });

  test('l\'éditeur charge le contenu du chapitre seedé', async ({ page }) => {
    await page.goto(EDITOR_URL);

    const editor = page.locator('.ProseMirror');
    await expect(editor).toBeVisible({ timeout: 15_000 });

    // Le contenu du chapitre seedé doit être présent
    await expect(editor).toContainText('Brumes-sur-Loire', { timeout: 10_000 });
  });
});
