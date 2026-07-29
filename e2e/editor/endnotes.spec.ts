// ABOUTME: E2E for endnotes in the editor's live paged preview — call colour and reading bubble.
// ABOUTME: Also guards that the Notes section-title setting is editable and persists.

import { test, expect } from '@playwright/test';
import {
  TEST_ENDNOTE_PROJECT_ID,
  TEST_ENDNOTE_NOTE_SENTINEL,
  TEST_ENDNOTE_CHAPTER_2_TITLE,
  TEST_ENDNOTE_NOTE_2_SENTINEL,
  TEST_ENDNOTE_PANEL_EDIT_PROJECT_ID,
  TEST_ENDNOTE_PANEL_EDIT_NOTE_SENTINEL,
  TEST_ENDNOTE_PANEL_DELETE_PROJECT_ID,
} from '../helpers/seed';

const EDITOR_URL = `/editor?project=${TEST_ENDNOTE_PROJECT_ID}`;
const SETTINGS_URL = `/project/${TEST_ENDNOTE_PROJECT_ID}/cockpit/settings`;
const PANEL_EDIT_EDITOR_URL = `/editor?project=${TEST_ENDNOTE_PANEL_EDIT_PROJECT_ID}`;
const PANEL_DELETE_EDITOR_URL = `/editor?project=${TEST_ENDNOTE_PANEL_DELETE_PROJECT_ID}`;

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

test.describe('endnotes — read-only list panel', () => {
  test('opens from the toolbar and lists both chapters and their notes', async ({ page }) => {
    await page.goto(EDITOR_URL);

    await page.getByRole('button', { name: 'Liste des notes' }).click();

    const panel = page.getByRole('dialog', { name: 'Liste des notes' });
    await expect(panel.getByText('Chapitre 1')).toBeVisible();
    await expect(panel.getByText(TEST_ENDNOTE_CHAPTER_2_TITLE)).toBeVisible();
    await expect(panel.getByText(TEST_ENDNOTE_NOTE_SENTINEL)).toBeVisible();
    await expect(panel.getByText(TEST_ENDNOTE_NOTE_2_SENTINEL)).toBeVisible();
  });
});

test.describe('endnotes — editing and deleting from the panel', () => {
  test('edits the active chapter’s note from the panel', async ({ page }) => {
    await page.goto(PANEL_EDIT_EDITOR_URL);

    await page.getByRole('button', { name: 'Liste des notes' }).click();
    const panel = page.getByRole('dialog', { name: 'Liste des notes' });
    await expect(panel.getByText(TEST_ENDNOTE_PANEL_EDIT_NOTE_SENTINEL, { exact: false })).toBeVisible();

    await panel.getByLabel(/Modifier la note 1/).click();

    const modal = page.getByRole('dialog', { name: 'Note de fin' });
    const noteEditor = modal.locator('.endnote-modal-editor');
    await expect(noteEditor).toContainText(TEST_ENDNOTE_PANEL_EDIT_NOTE_SENTINEL);

    await noteEditor.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' Complément.');
    await modal.getByRole('button', { name: 'Valider' }).click();

    await expect(modal).toBeHidden();
    await expect(panel.getByText(/Complément/)).toBeVisible();
  });

  test('deletes the active chapter’s note from the panel, with confirmation', async ({ page }) => {
    await page.goto(PANEL_DELETE_EDITOR_URL);

    await page.getByRole('button', { name: 'Liste des notes' }).click();
    const panel = page.getByRole('dialog', { name: 'Liste des notes' });

    await panel.getByLabel(/Supprimer la note 1/).click();

    const confirm = page.getByRole('alertdialog', { name: 'Supprimer la note ?' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Supprimer' }).click();

    await expect(confirm).toBeHidden();
    await expect(panel.getByText('Aucune note dans ce projet.')).toBeVisible();
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
