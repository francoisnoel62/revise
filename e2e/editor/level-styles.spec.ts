// ABOUTME: E2E coverage for per-profile semantic typography in the live editor preview.
// ABOUTME: Proves an author change affects only the active PDF publication profile.

import { test, expect } from '@playwright/test';
import { TEST_LEVEL_STYLES_PROJECT_ID, TEST_PROJECT_ID } from '../helpers/seed';

const EDITOR_URL = `/editor?project=${TEST_LEVEL_STYLES_PROJECT_ID}`;

test.describe('typographie par niveau', () => {
  test('applies a chapter-title size only to the active publication profile', async ({ page }) => {
    await page.goto(EDITOR_URL);

    await page.getByRole('button', { name: 'Typographie' }).click();
    await page.getByLabel('Taille (pt)').fill('22');

    const preview = page.getByTestId('publication-preview');
    await expect(preview).toHaveAttribute(
      'srcdoc',
      /\[data-semantic-role="titre-de-chapitre"\][^{]*\{[^}]*font-size:\s*22pt/,
    );
    const previewFrame = page.frameLocator('[data-testid="publication-preview"]');
    const chapterTitle = previewFrame.locator('[data-semantic-role="titre-de-chapitre"]').first();
    await expect(chapterTitle).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(() => chapterTitle.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
      .toBeCloseTo(22 * (96 / 72), 1);

    await page.getByLabel('Profil de publication').selectOption('a5');
    await expect(preview).toHaveAttribute('data-profile-id', 'a5');
    await expect(preview).not.toHaveAttribute(
      'srcdoc',
      /\[data-semantic-role="titre-de-chapitre"\][^{]*\{[^}]*font-size:\s*22pt/,
    );
    await expect
      .poll(() => chapterTitle.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
      .toBeCloseTo(14 * (96 / 72), 1);

    await page.getByLabel('Profil de publication').selectOption('kdp-6x9');
    await expect(preview).toHaveAttribute('data-profile-id', 'kdp-6x9');
    await expect(preview).toHaveAttribute(
      'srcdoc',
      /\[data-semantic-role="titre-de-chapitre"\][^{]*\{[^}]*font-size:\s*22pt/,
    );
    await expect
      .poll(() => chapterTitle.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
      .toBeCloseTo(22 * (96 / 72), 1);

    await expect(page.getByRole('button', { name: 'Typographie' })).toBeEnabled({ timeout: 10_000 });
    await page.reload();
    await page.getByRole('button', { name: 'Typographie' }).click();
    await expect(page.getByLabel('Taille (pt)')).toHaveValue('22');
    const reloadedTitle = page
      .frameLocator('[data-testid="publication-preview"]')
      .locator('[data-semantic-role="titre-de-chapitre"]')
      .first();
    await expect(reloadedTitle).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(() => reloadedTitle.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
      .toBeCloseTo(22 * (96 / 72), 1);
  });

  test('applies body typography after opening a legacy manuscript', async ({ page }) => {
    await page.goto(`/editor?project=${TEST_PROJECT_ID}`);

    await page.getByRole('button', { name: 'Typographie' }).click();
    await page.getByLabel('Niveau de texte').selectOption('corps');
    await page.getByLabel('Taille (pt)').fill('20');

    const bodyParagraph = page
      .frameLocator('[data-testid="publication-preview"]')
      .locator('[data-semantic-role="corps"]')
      .first();
    await expect(bodyParagraph).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(() => bodyParagraph.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)))
      .toBeCloseTo(20 * (96 / 72), 1);
  });
});
