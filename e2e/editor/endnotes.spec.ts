// ABOUTME: E2E for endnotes in the editor's live paged preview — call colour and reading bubble.
// ABOUTME: Also guards that the Notes section-title setting is editable and persists.

import { test, expect } from '@playwright/test';
import { TEST_ENDNOTE_PROJECT_ID, TEST_ENDNOTE_NOTE_SENTINEL } from '../helpers/seed';

const EDITOR_URL = `/editor?project=${TEST_ENDNOTE_PROJECT_ID}`;
const SETTINGS_URL = `/project/${TEST_ENDNOTE_PROJECT_ID}/cockpit/settings`;

test.describe('endnotes — reading preview', () => {
  test('the endnote call number is black, the same colour as the body text', async ({ page }) => {
    await page.goto(EDITOR_URL);

    const previewFrame = page.frameLocator('[data-testid="publication-preview"]');
    await expect(previewFrame.locator('.pagedjs_page').first()).toBeVisible({ timeout: 15_000 });

    const call = previewFrame.locator('.pagedjs_page .endnote-ref').first();
    await expect(call).toBeVisible();

    // The call must read as body text (black), not a distinct blue link colour.
    const { callColor, bodyColor } = await call.evaluate((el) => ({
      callColor: getComputedStyle(el).color,
      bodyColor: getComputedStyle(el.ownerDocument.body).color,
    }));
    expect(callColor).toBe(bodyColor);
  });

  test('hovering an endnote call reveals its note body in the reading bubble', async ({ page }) => {
    await page.goto(EDITOR_URL);

    const previewFrame = page.frameLocator('[data-testid="publication-preview"]');
    await expect(previewFrame.locator('.pagedjs_page').first()).toBeVisible({ timeout: 15_000 });

    const call = previewFrame.locator('.pagedjs_page .endnote-ref').first();
    await expect(call).toBeVisible();

    const bubble = previewFrame.locator('#endnote-bubble');
    await expect(bubble).toBeHidden();

    await call.hover();

    await expect(bubble).toBeVisible();
    await expect(bubble).toContainText(TEST_ENDNOTE_NOTE_SENTINEL);
  });
});

test.describe('endnotes — Notes section title setting', () => {
  test('the Notes section title is editable and persists across a reload', async ({ page }) => {
    await page.goto(SETTINGS_URL);

    const input = page.locator('#endnotesTitle');
    await expect(input).toBeVisible();

    await input.fill('Notes et références');
    await page.getByTestId('settings-save-button').click();
    await expect(page.getByText('Modifications enregistrées')).toBeVisible();

    await page.reload();
    await expect(page.locator('#endnotesTitle')).toHaveValue('Notes et références');
  });
});
