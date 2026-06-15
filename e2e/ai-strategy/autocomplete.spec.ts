// ABOUTME: E2E coverage for the autocomplete writing loop with mocked SSE completions
// ABOUTME: Verifies editor UX, telemetry emission, partial acceptance and intent variants

import { test, expect, type Page, type Route, type Request } from '@playwright/test';
import {
  TEST_AUTOCOMPLETE_PROJECT_ID,
  TEST_AUTOCOMPLETE_CHAPTER_TEXT,
} from '../helpers/seed';

const EDITOR_URL = `/editor?project=${TEST_AUTOCOMPLETE_PROJECT_ID}`;

type TelemetryBody = Record<string, unknown>;
type CompletionBody = Record<string, unknown>;

interface MockRoutes {
  completionBodies: CompletionBody[];
  telemetryBodies: TelemetryBody[];
  waitForTelemetry: (
    predicate: (body: TelemetryBody) => boolean,
    timeoutMs?: number
  ) => Promise<TelemetryBody>;
}

function parseJsonRequest(request: Request): Record<string, unknown> {
  const raw = request.postData();
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function setupAutocompleteRoutes(
  page: Page,
  suggestions: string[]
): Promise<MockRoutes> {
  const completionBodies: CompletionBody[] = [];
  const telemetryBodies: TelemetryBody[] = [];
  const waiters: Array<{
    predicate: (body: TelemetryBody) => boolean;
    resolve: (body: TelemetryBody) => void;
  }> = [];

  await page.route('**/api/completion/stream', async (route: Route, request: Request) => {
    completionBodies.push(parseJsonRequest(request));
    const suggestion = suggestions.shift() ?? ' une suite de test.';
    const midpoint = Math.max(1, Math.floor(suggestion.length / 2));
    const chunks = [suggestion.slice(0, midpoint), suggestion.slice(midpoint)];
    const body = `data: ${JSON.stringify({
      type: 'metadata',
      providerType: 'anthropic',
      model: 'claude-sonnet-4-5',
    })}\n\n` + chunks
      .map((text) => `data: ${JSON.stringify({ text })}\n\n`)
      .join('') + 'data: [DONE]\n\n';

    await route.fulfill({
      status: 200,
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
      },
      body,
    });
  });

  await page.route('**/api/completion/telemetry', async (route: Route, request: Request) => {
    const body = parseJsonRequest(request);
    telemetryBodies.push(body);

    for (let i = waiters.length - 1; i >= 0; i -= 1) {
      const waiter = waiters[i];
      if (waiter.predicate(body)) {
        waiters.splice(i, 1);
        waiter.resolve(body);
      }
    }

    await route.fulfill({ status: 204, body: '' });
  });

  return {
    completionBodies,
    telemetryBodies,
    waitForTelemetry: (predicate, timeoutMs = 10_000) =>
      new Promise<TelemetryBody>((resolve, reject) => {
        const existing = telemetryBodies.find(predicate);
        if (existing) {
          resolve(existing);
          return;
        }
        const waiter = {
          predicate,
          resolve: (body: TelemetryBody) => {
            clearTimeout(timeout);
            resolve(body);
          },
        };
        const timeout = setTimeout(() => {
          const index = waiters.indexOf(waiter);
          if (index >= 0) waiters.splice(index, 1);
          reject(new Error('Timed out waiting for autocomplete telemetry payload'));
        }, timeoutMs);
        waiters.push(waiter);
      }),
  };
}

async function openEditor(page: Page) {
  await page.goto(EDITOR_URL);
  const editor = page.locator('.ProseMirror');
  await expect(editor).toBeVisible({ timeout: 15_000 });
  return editor;
}

async function resetEditorText(page: Page, text = TEST_AUTOCOMPLETE_CHAPTER_TEXT) {
  const editor = await openEditor(page);
  await editor.click();
  await page.keyboard.press('Control+A');
  if (text.length === 0) {
    await page.keyboard.press('Backspace');
  } else {
    await page.keyboard.type(text);
  }
  return editor;
}

async function triggerSuggestion(page: Page, expectedGhostText: string) {
  await page.keyboard.press('Tab');
  const ghost = page.locator('.autocomplete-ghost');
  await expect(ghost).toContainText(expectedGhostText, { timeout: 10_000 });
  await expect(page.locator('.autocomplete-hint')).toContainText(
    'Ctrl/Cmd+. variante'
  );
  return ghost;
}

test.describe.serial('Autocomplétion littéraire — E2E éditeur', () => {
  test('déclenche une suggestion fantôme sans insertion immédiate', async ({ page }) => {
    const routes = await setupAutocompleteRoutes(page, [' aperçut Oslo dans la cour.']);
    const editor = await resetEditorText(page);

    await triggerSuggestion(page, 'aperçut Oslo');

    expect(routes.completionBodies).toHaveLength(1);
    expect(routes.completionBodies[0]).toMatchObject({
      projectId: TEST_AUTOCOMPLETE_PROJECT_ID,
      intent: 'natural',
    });
    expect(routes.completionBodies[0].textBeforeCursor).toContain('Éliane Vaucresson');
    await expect(page.locator('.autocomplete-ghost')).toContainText('aperçut Oslo dans la cour.');
    expect(routes.telemetryBodies).toHaveLength(0);
  });

  test('accepte toute la suggestion avec un second Tab et émet accepted_full', async ({ page }) => {
    const routes = await setupAutocompleteRoutes(page, [' aperçut Oslo dans la cour.']);
    const editor = await resetEditorText(page);

    await triggerSuggestion(page, 'aperçut Oslo');

    const telemetry = routes.waitForTelemetry(
      (body) => body.type === 'lifecycle' && body.outcome === 'accepted_full'
    );
    await page.keyboard.press('Tab');

    await expect(page.locator('.autocomplete-ghost')).toHaveCount(0);
    await expect(editor).toContainText('aperçut Oslo dans la cour.');

    const body = await telemetry;
    expect(body.projectId).toBe(TEST_AUTOCOMPLETE_PROJECT_ID);
    expect(body.providerType).toBe('anthropic');
    expect(body.model).toBe('claude-sonnet-4-5');
    expect(body.lengthChars).toBeGreaterThan(0);
    expect(body.acceptedChars).toBe(body.lengthChars);
    expect(body.firstTokenMs).not.toBeNull();
  });

  test('rejette une suggestion avec Escape et émet rejected_escape', async ({ page }) => {
    const routes = await setupAutocompleteRoutes(page, [' ralentit devant la porte.']);
    await resetEditorText(page);

    await triggerSuggestion(page, 'ralentit');

    const telemetry = routes.waitForTelemetry(
      (body) => body.type === 'lifecycle' && body.outcome === 'rejected_escape'
    );
    await page.keyboard.press('Escape');

    await expect(page.locator('.autocomplete-ghost')).toHaveCount(0);
    const body = await telemetry;
    expect(body.acceptedChars).toBe(0);
  });

  test('remplace la suggestion par la frappe utilisateur et émet superseded_typing', async ({ page }) => {
    const routes = await setupAutocompleteRoutes(page, [' sentit le parquet céder.']);
    const editor = await resetEditorText(page);

    await triggerSuggestion(page, 'parquet');

    const telemetry = routes.waitForTelemetry(
      (body) => body.type === 'lifecycle' && body.outcome === 'superseded_typing'
    );
    await page.keyboard.type(' nota un silence');

    const body = await telemetry;
    expect(body.acceptedChars).toBe(0);
    await expect(editor).toContainText('nota un silence');
  });

  test('accepte seulement le prochain mot puis termine en accepted_partial', async ({ page }) => {
    const routes = await setupAutocompleteRoutes(page, [' le mécanisme caché, puis retint son souffle.']);
    const editor = await resetEditorText(page);

    await triggerSuggestion(page, 'mécanisme caché');
    await page.keyboard.press('Control+ArrowRight');

    await expect(editor).toContainText('et le');
    await expect(page.locator('.autocomplete-ghost')).toContainText('mécanisme caché');

    const telemetry = routes.waitForTelemetry(
      (body) => body.type === 'lifecycle' && body.outcome === 'accepted_partial'
    );
    await page.keyboard.press('Escape');

    const body = await telemetry;
    expect(body.acceptedChars).toBeGreaterThan(0);
    expect(body.acceptedWords).toBeGreaterThan(0);
  });

  test('accepte un fragment puis termine en accepted_partial', async ({ page }) => {
    const routes = await setupAutocompleteRoutes(page, [' ralentit, comme s’il écoutait la pluie.']);
    const editor = await resetEditorText(page);

    await triggerSuggestion(page, 'ralentit');
    await page.keyboard.press('Alt+ArrowRight');

    await expect(editor).toContainText('ralentit,');
    await expect(page.locator('.autocomplete-ghost')).toContainText('comme s’il');

    const telemetry = routes.waitForTelemetry(
      (body) => body.type === 'lifecycle' && body.outcome === 'accepted_partial'
    );
    await page.keyboard.press('Escape');

    const body = await telemetry;
    expect(body.acceptedWords).toBeGreaterThan(0);
  });

  test('régénère une variante discrète avec Mod-. et envoie intent=shorter', async ({ page }) => {
    const routes = await setupAutocompleteRoutes(page, [
      ' observa longuement la poussière suspendue.',
      ' attendit.',
    ]);
    await resetEditorText(page);

    await triggerSuggestion(page, 'poussière suspendue');
    await page.keyboard.press('Control+Period');

    await expect(page.locator('.autocomplete-ghost')).toContainText('attendit', {
      timeout: 10_000,
    });
    await expect(page.locator('.autocomplete-hint')).toContainText('plus bref');
    expect(routes.completionBodies).toHaveLength(2);
    expect(routes.completionBodies[0].intent).toBe('natural');
    expect(routes.completionBodies[1].intent).toBe('shorter');
  });

  test('n’appelle pas le stream quand il n’y a aucun texte avant le curseur', async ({ page }) => {
    const routes = await setupAutocompleteRoutes(page, [' ne doit pas être appelée.']);
    await resetEditorText(page, '');

    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    expect(routes.completionBodies).toHaveLength(0);
    await expect(page.locator('.autocomplete-ghost')).toHaveCount(0);
  });

  test('émet une télémétrie deletion si le texte accepté est supprimé rapidement', async ({ page }) => {
    await page.addInitScript(() => {
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) =>
        // Keep this comfortably above local Playwright slowMo (250ms), otherwise the
        // deletion watcher can run before Ctrl+Z has actually changed the document.
        originalSetTimeout(handler, timeout === 30000 ? 1500 : timeout, ...args)) as typeof window.setTimeout;
    });

    const routes = await setupAutocompleteRoutes(page, [' remarqua la clef rouge.']);
    await resetEditorText(page);

    await triggerSuggestion(page, 'clef rouge');

    const accepted = routes.waitForTelemetry(
      (body) => body.type === 'lifecycle' && body.outcome === 'accepted_full'
    );
    const deletion = routes.waitForTelemetry((body) => body.type === 'deletion');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Control+Z');

    const acceptedBody = await accepted;
    const deletionBody = await deletion;
    expect(deletionBody.suggestionId).toBe(acceptedBody.suggestionId);
    expect(deletionBody.deletedAfterMs).toBeGreaterThanOrEqual(0);
  });
});
