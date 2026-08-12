// ABOUTME: Unit tests for the E2E server health probe.
// ABOUTME: Covers the dev-server rot signature that otherwise invalidates a whole run.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { assertServerHealthy } from './server-health';

const BASE_URL = 'http://localhost:3000';

function respondWith(status: number, contentType: string, body = '') {
  return vi.fn().mockResolvedValue(
    new Response(body, { status, headers: { 'content-type': contentType } })
  );
}

describe('assertServerHealthy', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves when the auth route answers with JSON', async () => {
    vi.stubGlobal('fetch', respondWith(200, 'application/json', '{"csrfToken":"abc"}'));

    await expect(assertServerHealthy(BASE_URL)).resolves.toBeUndefined();
  });

  it('probes the auth route of the given base URL', async () => {
    const fetchMock = respondWith(200, 'application/json', '{}');
    vi.stubGlobal('fetch', fetchMock);

    await assertServerHealthy(BASE_URL);

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/api/auth/csrf`,
      expect.anything()
    );
  });

  // The signature of a "next dev" that has lost its render worker.
  it('rejects when the server answers 500, naming the status', async () => {
    vi.stubGlobal('fetch', respondWith(500, 'text/html', '<!DOCTYPE html>'));

    await expect(assertServerHealthy(BASE_URL)).rejects.toThrow(/500/);
  });

  it('tells the author to restart the dev server', async () => {
    vi.stubGlobal('fetch', respondWith(500, 'text/html'));

    await expect(assertServerHealthy(BASE_URL)).rejects.toThrow(/restart/i);
  });

  // A 200 carrying HTML means something other than the Auth.js handler answered.
  it('rejects when the route answers 200 with HTML instead of JSON', async () => {
    vi.stubGlobal('fetch', respondWith(200, 'text/html', '<!DOCTYPE html>'));

    await expect(assertServerHealthy(BASE_URL)).rejects.toThrow(/text\/html/);
  });

  it('rejects with the underlying reason when the connection is refused', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    await expect(assertServerHealthy(BASE_URL)).rejects.toThrow(/ECONNREFUSED/);
  });
});
