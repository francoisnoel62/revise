// ABOUTME: E2E test for masking/showing the live publication preview in the editor.
// ABOUTME: Guards the CSS-only toggle (preview stays mounted) and its localStorage persistence.

import { test, expect } from '@playwright/test';
import { TEST_PROJECT_ID } from '../helpers/seed';

const EDITOR_URL = `/editor?project=${TEST_PROJECT_ID}`;

test.describe('editor preview toggle', () => {
  test('hides the preview and widens the editor, and remembers the choice on reload', async ({
    page,
  }) => {
    await page.goto(EDITOR_URL);

    const preview = page.getByTestId('publication-preview');
    await expect(preview).toBeVisible();

    const toggleButton = page.getByTestId('preview-toggle-button');
    await expect(toggleButton).toBeVisible();

    const editorPane = page.getByTestId('editor-pane');
    const widthBefore = await editorPane.evaluate((el) => el.getBoundingClientRect().width);

    await toggleButton.click();

    // CSS-only masking: the preview iframe stays mounted, only hidden from view.
    await expect(preview).toBeHidden();
    await expect(preview).toBeAttached();

    const widthAfter = await editorPane.evaluate((el) => el.getBoundingClientRect().width);
    expect(widthAfter).toBeGreaterThan(widthBefore);

    await page.reload();

    await expect(page.getByTestId('publication-preview')).toBeHidden();
    await expect(page.getByTestId('publication-preview')).toBeAttached();
  });
});
