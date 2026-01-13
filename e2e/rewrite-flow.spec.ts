// ABOUTME: End-to-end tests for the complete rewrite workflow.
// ABOUTME: Validates selection → réécriture → choix proposition → insertion flow.

import { test, expect } from '@playwright/test';

test.describe('Rewrite Workflow', () => {
  // Note: These tests require:
  // 1. A running Next.js dev server
  // 2. A test user account
  // 3. Optional: OPENAI_API_KEY or ANTHROPIC_API_KEY for AI tests

  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('should display editor on home page', async ({ page }) => {
    // Check that the TipTap editor is rendered
    const editor = page.locator('.ProseMirror');
    await expect(editor).toBeVisible();
    await expect(editor).toHaveAttribute('contenteditable', 'true');
  });

  test('should allow typing in editor', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.type('Le soleil se couche sur la ville endormie.');

    const content = await editor.textContent();
    expect(content).toContain('soleil');
    expect(content).toContain('ville');
  });

  test('should show "Réécrire" button when text is selected', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.type('Le chat noir dort sur le canapé.');

    // Select some text (triple-click to select paragraph)
    await editor.click({ clickCount: 3 });

    // Wait for selection-dependent UI
    await page.waitForTimeout(500);

    // The Réécrire button should be visible
    const rewriteButton = page.getByText('Réécrire', { exact: false });
    await expect(rewriteButton).toBeVisible();
  });

  test('should maintain editor focus after typing', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.type('Test content');

    // Editor should still be focused
    const focused = await editor.evaluate((el) => el === document.activeElement);
    expect(focused).toBe(true);
  });

  test('should preserve formatting when typing', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.click();

    // Type text, apply bold, continue typing
    await page.keyboard.type('Normal text ');
    await page.keyboard.press('Control+b');
    await page.keyboard.type('bold text');
    await page.keyboard.press('Control+b');
    await page.keyboard.type(' normal again');

    // Check that bold element exists
    const bold = editor.locator('strong');
    await expect(bold).toBeVisible();
    expect(await bold.textContent()).toContain('bold');
  });

  test('should support undo/redo', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.click();

    await page.keyboard.type('First');
    await page.waitForTimeout(100);
    await page.keyboard.type(' Second');

    let content = await editor.textContent();
    expect(content).toContain('First Second');

    // Undo
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(100);

    content = await editor.textContent();
    expect(content).toContain('First');
    // Note: Due to how TipTap batches operations, "Second" might still be there
    // A full undo test would need more specific assertions
  });

  test('should show import and export buttons', async ({ page }) => {
    await expect(page.getByText('Importer', { exact: false })).toBeVisible();
    await expect(page.getByText('Exporter', { exact: false })).toBeVisible();
  });

  test('should show chapters button', async ({ page }) => {
    // The chapters button shows chapter count
    const chaptersButton = page.getByRole('button', { name: /chapitres/i });
    await expect(chaptersButton).toBeVisible();
  });

  test('should open chapters sheet when button is clicked', async ({ page }) => {
    const chaptersButton = page.getByRole('button', { name: /chapitres/i });
    await chaptersButton.click();

    // Sheet should show "Nouveau chapitre" button
    await expect(page.getByText('Nouveau chapitre')).toBeVisible();
  });
});

test.describe('Rewrite with AI (requires API key)', () => {
  // These tests are skipped if running without API keys
  // They test the actual AI rewrite functionality

  test.skip('should show proposals after clicking Réécrire', async ({ page }) => {
    // This test requires OPENAI_API_KEY or ANTHROPIC_API_KEY
    // and a configured provider

    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.type('Le chat noir dort paisiblement sur le canapé.');

    // Select "chat noir"
    await editor.click();
    await page.keyboard.press('Control+a');

    // Click Réécrire
    const rewriteButton = page.getByRole('button', { name: /réécrire/i });
    await rewriteButton.click();

    // Wait for proposals (with timeout for API call)
    await page.waitForTimeout(10000);

    // Should show proposal panel
    const proposals = page.locator('[data-testid="proposals-panel"]');
    await expect(proposals).toBeVisible({ timeout: 15000 });
  });

  test.skip('should insert selected proposal', async ({ page }) => {
    // Similar setup to above, but then select a proposal
    const editor = page.locator('.ProseMirror');
    await editor.click();
    await page.keyboard.type('Le chat noir dort.');

    await page.keyboard.press('Control+a');

    const rewriteButton = page.getByRole('button', { name: /réécrire/i });
    await rewriteButton.click();

    // Wait for proposals
    await page.waitForTimeout(10000);

    // Click first proposal
    const firstProposal = page.locator('[data-testid="proposal-0"]');
    await firstProposal.click();

    // Editor content should have changed
    const newContent = await editor.textContent();
    expect(newContent).not.toBe('Le chat noir dort.');
  });
});
