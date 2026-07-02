// ABOUTME: E2E test for visible page numbers in the editor's live publication preview.
// ABOUTME: Guards against BookCssBuilder regressing to a silent counter with no on-page digit.

import { test, expect } from '@playwright/test';
import { TEST_PROJECT_ID } from '../helpers/seed';

const EDITOR_URL = `/editor?project=${TEST_PROJECT_ID}`;

test.describe('page numbers in the editor preview', () => {
  test('prints a visible Arabic page number on the first page of the preview', async ({ page }) => {
    await page.goto(EDITOR_URL);

    const previewFrame = page.frameLocator('[data-testid="publication-preview"]');
    const firstPage = previewFrame.locator('.pagedjs_page').first();
    await expect(firstPage).toBeVisible({ timeout: 15_000 });

    // Paged.js paints the counter as CSS-generated content (::after) on the margin
    // box, not as real DOM text — toHaveText() would never see it, so we read the
    // computed pseudo-element content instead.
    await expect
      .poll(
        () =>
          firstPage.evaluate((el) => {
            const marginContent = el.querySelector(
              '.pagedjs_margin-bottom-center .pagedjs_margin-content'
            );
            return marginContent ? getComputedStyle(marginContent, '::after').content : null;
          }),
        { timeout: 15_000 }
      )
      .toBe('counter(page)');
  });
});
