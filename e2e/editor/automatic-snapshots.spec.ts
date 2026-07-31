// ABOUTME: E2E for the automatic project snapshot path through a real editor session.
// ABOUTME: Opening an eligible project heartbeats the server clock and exposes the created version in history.

import { expect, test } from '@playwright/test';
import {
  TEST_AUTOMATIC_SNAPSHOT_PROJECT_ID,
  resetAutomaticSnapshotFixture,
} from '../helpers/seed';

const LOREM_IPSUM_WORDS = [
  'Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua',
];

function loremIpsumDocument(wordCount: number): string {
  const text = Array.from(
    { length: wordCount },
    (_, index) => LOREM_IPSUM_WORDS[index % LOREM_IPSUM_WORDS.length],
  ).join(' ');

  return JSON.stringify({
    type: 'doc',
    content: [{
      type: 'paragraph',
      attrs: { semanticRole: 'corps' },
      content: [{ type: 'text', text }],
    }],
  });
}

test.describe('snapshots automatiques', () => {
  // These tests intentionally reset and mutate the same due-snapshot fixture.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async () => {
    await resetAutomaticSnapshotFixture();
  });

  test('creates the due automatic snapshot when an editor session is open', async ({ page }) => {
    await page.goto(`/editor?project=${TEST_AUTOMATIC_SNAPSHOT_PROJECT_ID}`);
    await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 15_000 });

    await page.locator('button[title="Historique des versions"]:visible').click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Historique des versions' });

    await expect(dialog.getByText('Snapshot automatique')).toBeVisible({ timeout: 20_000 });
    await expect(
      dialog.locator('[data-testid^="snapshot-row-"]').getByText('Automatique', { exact: true }),
    ).toBeVisible();
    await expect(dialog.getByText('v1', { exact: true })).toBeVisible();
  });

  test('keeps the caret position through autosave in a 500-word manuscript', async ({ page }) => {
    await resetAutomaticSnapshotFixture(loremIpsumDocument(500));
    await page.goto(`/editor?project=${TEST_AUTOMATIC_SNAPSHOT_PROJECT_ID}`);
    const editor = page.locator('.ProseMirror');
    await expect(editor).toBeVisible({ timeout: 15_000 });

    await editor.evaluate((element) => {
      const tiptapEditor = (element as HTMLElement & {
        editor?: {
          chain: () => {
            focus: () => { setTextSelection: (position: number) => { run: () => boolean } };
          };
        };
      }).editor;
      if (!tiptapEditor) throw new Error('TipTap editor unavailable');
      tiptapEditor.chain().focus().setTextSelection(250).run();
    });
    await page.keyboard.type('ab');
    const scrollBefore = await page.evaluate(() => window.scrollY);
    const selectionBefore = await editor.evaluate((element) => {
      const tiptapEditor = (element as HTMLElement & {
        editor?: { state: { selection: { from: number; to: number } } };
      }).editor;
      return tiptapEditor?.state.selection;
    });

    await page.waitForTimeout(2_500);

    await expect
      .poll(() =>
        page.evaluate(() => document.activeElement === document.querySelector('.ProseMirror')),
      )
      .toBe(true);
    await expect.poll(() => editor.evaluate((element) => {
      const tiptapEditor = (element as HTMLElement & {
        editor?: { state: { selection: { from: number; to: number } } };
      }).editor;
      return tiptapEditor?.state.selection;
    })).toEqual(selectionBefore);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  });

  test('keeps writing focus while asynchronous spell-check decorations arrive', async ({ page }) => {
    await page.goto(`/editor?project=${TEST_AUTOMATIC_SNAPSHOT_PROJECT_ID}`);
    const editor = page.locator('.ProseMirror');
    await expect(editor).toBeVisible({ timeout: 15_000 });

    await editor.click();
    await page.evaluate(() => {
      const focusEscapes: string[] = [];
      document.addEventListener('focusin', (event) => {
        if (event.target !== document.querySelector('.ProseMirror')) {
          focusEscapes.push((event.target as HTMLElement | null)?.tagName ?? 'unknown');
        }
      }, true);
      (window as Window & { focusEscapes: string[] }).focusEscapes = focusEscapes;
    });
    await editor.pressSequentially(' zqvxx');

    await expect(page.locator('.spell-error')).not.toHaveCount(0, { timeout: 10_000 });
    await expect.poll(() => page.evaluate(() => document.activeElement === document.querySelector('.ProseMirror'))).toBe(true);
    await expect.poll(() => page.evaluate(() => (window as Window & { focusEscapes: string[] }).focusEscapes)).toEqual([]);
  });
});
