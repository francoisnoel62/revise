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

    const pageNumber = firstPage.locator('.pagedjs_margin-bottom-center');
    await expect(pageNumber).toHaveText('1');
  });
});
