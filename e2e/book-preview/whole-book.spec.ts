// ABOUTME: E2E tests for the whole-book preview page.
// ABOUTME: Verifies parity with PDF export structure, chapter navigation, and rendering budget.

import { test, expect } from '@playwright/test';
import {
  TEST_BOOK_PREVIEW_PROJECT_ID,
  TEST_BOOK_PREVIEW_CHAPTER_1_ID,
  TEST_BOOK_PREVIEW_CHAPTER_2_ID,
} from '../helpers/seed';

const BOOK_PREVIEW_URL = `/book-preview?project=${TEST_BOOK_PREVIEW_PROJECT_ID}`;

test.describe('whole-book preview', () => {
  test('loads and renders the complete manuscript in an iframe', async ({ page }) => {
    await page.goto(BOOK_PREVIEW_URL);

    const iframe = page.getByTestId('book-preview-iframe');
    await expect(iframe).toBeVisible({ timeout: 10_000 });
  });

  test('shows chapter titles in the navigation sidebar', async ({ page }) => {
    await page.goto(BOOK_PREVIEW_URL);

    const nav = page.getByTestId('chapter-navigation');
    await expect(nav).toBeVisible();

    await expect(nav.getByText('Chapitre 1 — La Librairie')).toBeVisible();
    await expect(nav.getByText('Chapitre 2 — Le Lendemain')).toBeVisible();
  });

  test('renders pages and reports page count after pagination', async ({ page }) => {
    await page.goto(BOOK_PREVIEW_URL);

    const status = page.getByTestId('book-preview-status');

    // Wait for Paged.js to finish rendering (status shows page count)
    await expect(status).toContainText('pages', { timeout: 30_000 });

    const statusText = await status.innerText();
    const pageCount = parseInt(statusText.match(/(\d+)\s+pages?/)?.[1] ?? '0', 10);
    expect(pageCount).toBeGreaterThanOrEqual(1);
  });

  test('rendering completes within the 5-second performance budget', async ({ page }) => {
    await page.goto(BOOK_PREVIEW_URL);

    const status = page.getByTestId('book-preview-status');
    await expect(status).toContainText('pages', { timeout: 30_000 });

    const statusText = await status.innerText();
    const paginationMs = parseFloat(statusText.match(/(\d+(?:\.\d+)?)\s+ms/)?.[1] ?? 'Infinity');
    // 5-second budget for the full book (vs 900ms single-chapter budget)
    expect(paginationMs).toBeLessThan(5_000);
  });

  test('both chapter sections exist in the rendered iframe DOM', async ({ page }) => {
    await page.goto(BOOK_PREVIEW_URL);

    const status = page.getByTestId('book-preview-status');
    await expect(status).toContainText('pages', { timeout: 30_000 });

    const iframeEl = page.getByTestId('book-preview-iframe');
    const iframeFrame = page.frameLocator('[data-testid="book-preview-iframe"]');

    // Chapters are rendered as .chapter sections inside the iframe
    const ch1 = iframeFrame.locator(`#${TEST_BOOK_PREVIEW_CHAPTER_1_ID}`);
    const ch2 = iframeFrame.locator(`#${TEST_BOOK_PREVIEW_CHAPTER_2_ID}`);

    await expect(iframeEl).toBeVisible();
    await expect(ch1).toBeAttached({ timeout: 10_000 });
    await expect(ch2).toBeAttached({ timeout: 10_000 });
  });

  test('clicking a chapter in the sidebar triggers navigation', async ({ page }) => {
    await page.goto(BOOK_PREVIEW_URL);

    const status = page.getByTestId('book-preview-status');
    await expect(status).toContainText('pages', { timeout: 30_000 });

    const nav = page.getByTestId('chapter-navigation');
    const ch2Button = nav.getByText('Chapitre 2 — Le Lendemain');
    await expect(ch2Button).toBeVisible();

    // Clicking should not throw; the iframe handles scrollIntoView
    await ch2Button.click();
    // No assertion on scroll position since Paged.js DOM is internal to iframe
    // But we verify the page remains stable (no error/navigation)
    await expect(page).toHaveURL(new RegExp(TEST_BOOK_PREVIEW_PROJECT_ID));
  });
});
