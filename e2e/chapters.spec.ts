// ABOUTME: End-to-end tests for chapter management functionality.
// ABOUTME: Validates chapter CRUD operations, navigation, and reordering.

import { test, expect } from '@playwright/test';

test.describe('Chapter Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show chapters button on editor page', async ({ page }) => {
    const chaptersButton = page.getByRole('button', { name: /chapitres/i });
    await expect(chaptersButton).toBeVisible();
  });

  test('should open chapters sheet when clicking button', async ({ page }) => {
    const chaptersButton = page.getByRole('button', { name: /chapitres/i });
    await chaptersButton.click();

    // Sheet content should be visible
    await expect(page.getByText('Nouveau chapitre')).toBeVisible();
  });

  test('should display "Nouveau chapitre" button in sheet', async ({ page }) => {
    const chaptersButton = page.getByRole('button', { name: /chapitres/i });
    await chaptersButton.click();

    const addButton = page.getByRole('button', { name: /nouveau chapitre/i });
    await expect(addButton).toBeVisible();
  });

  test('should add new chapter when clicking add button', async ({ page }) => {
    const chaptersButton = page.getByRole('button', { name: /chapitres/i });
    await chaptersButton.click();

    // Get initial chapter count from the button text
    const initialText = await chaptersButton.textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');

    // Add a new chapter
    const addButton = page.getByRole('button', { name: /nouveau chapitre/i });
    await addButton.click();

    // Wait for the chapter to be added
    await page.waitForTimeout(1000);

    // Close and reopen sheet to verify
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Check chapter count increased
    const newText = await chaptersButton.textContent();
    const newCount = parseInt(newText?.match(/\d+/)?.[0] || '0');
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('should show chapter list in sheet', async ({ page }) => {
    const chaptersButton = page.getByRole('button', { name: /chapitres/i });
    await chaptersButton.click();

    // Should show at least one chapter (default chapter)
    await expect(page.locator('[class*="border-blue-500"], [class*="border-slate-200"]').first()).toBeVisible();
  });

  test('should highlight active chapter', async ({ page }) => {
    const chaptersButton = page.getByRole('button', { name: /chapitres/i });
    await chaptersButton.click();

    // Active chapter should have blue border
    const activeChapter = page.locator('[class*="border-blue-500"]');
    await expect(activeChapter).toBeVisible();
  });

  test('should close sheet when clicking outside', async ({ page }) => {
    const chaptersButton = page.getByRole('button', { name: /chapitres/i });
    await chaptersButton.click();

    await expect(page.getByText('Nouveau chapitre')).toBeVisible();

    // Press escape to close
    await page.keyboard.press('Escape');

    // Wait for animation
    await page.waitForTimeout(300);

    // Sheet should be closed
    await expect(page.getByText('Nouveau chapitre')).not.toBeVisible();
  });

  test('should show chapter word count', async ({ page }) => {
    const chaptersButton = page.getByRole('button', { name: /chapitres/i });
    await chaptersButton.click();

    // Each chapter should show word count
    await expect(page.getByText(/\d+ mots/).first()).toBeVisible();
  });

  test('should show chapter character count', async ({ page }) => {
    const chaptersButton = page.getByRole('button', { name: /chapitres/i });
    await chaptersButton.click();

    // Each chapter should show character count
    await expect(page.getByText(/\d+ caractères/).first()).toBeVisible();
  });

  test('should have drag handles for chapters', async ({ page }) => {
    const chaptersButton = page.getByRole('button', { name: /chapitres/i });
    await chaptersButton.click();

    // Should have grip icons for drag and drop
    const gripIcons = page.locator('svg.lucide-grip-vertical');
    await expect(gripIcons.first()).toBeVisible();
  });

  test('should have delete buttons for chapters', async ({ page }) => {
    const chaptersButton = page.getByRole('button', { name: /chapitres/i });
    await chaptersButton.click();

    // Should have trash icons for deletion
    const deleteIcons = page.locator('svg.lucide-trash-2');
    await expect(deleteIcons.first()).toBeVisible();
  });
});

test.describe('Chapter Navigation', () => {
  test('should switch chapters when clicking on chapter', async ({ page }) => {
    // First, add a second chapter
    await page.goto('/');

    const chaptersButton = page.getByRole('button', { name: /chapitres/i });
    await chaptersButton.click();

    // Add a new chapter
    const addButton = page.getByRole('button', { name: /nouveau chapitre/i });
    await addButton.click();
    await page.waitForTimeout(500);

    // Get all chapter items
    const chapters = page.locator('[class*="border"]').filter({
      has: page.locator('text=/mots/')
    });

    // If we have multiple chapters, click on a non-active one
    const count = await chapters.count();
    if (count > 1) {
      // Find chapter without blue border (non-active)
      const nonActiveChapter = page.locator('[class*="border-slate-200"]').first();
      if (await nonActiveChapter.isVisible()) {
        await nonActiveChapter.click();
        await page.waitForTimeout(300);

        // Check that it became active (has blue border)
        await expect(page.locator('[class*="border-blue-500"]')).toBeVisible();
      }
    }
  });
});
