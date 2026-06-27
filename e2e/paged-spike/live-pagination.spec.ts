// ABOUTME: End-to-end proof that live TipTap edits trigger bounded paged re-rendering.
// ABOUTME: Verifies debounce, page overflow, performance budget, and caret preservation.

import { expect, test } from '@playwright/test';

test('a realistic chapter re-paginates at the typing pause without moving the caret', async ({ page }) => {
  await page.goto('/editor/paged-spike');

  const status = page.getByTestId('pagination-status');
  await expect(status).toHaveAttribute('data-render-count', '1');
  const initialPageCount = Number(await status.getAttribute('data-page-count'));

  const editor = page.getByTestId('paged-editor').locator('.ProseMirror');
  const chapter = Array.from({ length: 80 }, (_, paragraphIndex) =>
    Array.from({ length: 50 }, (_, wordIndex) => `mot${paragraphIndex}-${wordIndex}`).join(' ')
  ).join('\n\n');
  await editor.fill(chapter);
  const caretBeforePagination = await editor.evaluate(() => window.getSelection()?.anchorOffset);

  await expect(status).toHaveAttribute('data-render-count', '2', { timeout: 10_000 });
  const duration = Number(await status.getAttribute('data-pagination-ms'));
  const pageCount = Number(await status.getAttribute('data-page-count'));
  const caretAfterPagination = await editor.evaluate(() => window.getSelection()?.anchorOffset);

  expect(duration).toBeLessThan(900);
  expect(pageCount).toBeGreaterThan(initialPageCount);
  expect(caretAfterPagination).toBe(caretBeforePagination);
});
