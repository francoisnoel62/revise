// ABOUTME: Health probe for the server the E2E suite runs against.
// ABOUTME: Stops the run with an actionable message when that server is up but not serving.

const HEALTH_PATH = '/api/auth/csrf';

// Generous: on a cold server this route still pays for its own JIT compile.
const PROBE_TIMEOUT_MS = 60_000;

/**
 * Fails unless the server is genuinely serving Auth.js.
 *
 * `/api/auth/csrf` is the probe because it is cheap, needs no session, exercises a real
 * server route rather than a static asset, and answers JSON — so an HTML body is proof
 * that something other than the Auth.js handler replied. It is also exactly what
 * auth.setup depends on, and every authenticated project depends on auth.setup.
 */
export async function assertServerHealthy(baseUrl: string): Promise<void> {
  const url = `${baseUrl}${HEALTH_PATH}`;
  let reason: string;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
    const contentType = response.headers.get('content-type') ?? 'no content-type';
    if (response.ok && contentType.includes('application/json')) return;
    reason = `answered ${response.status} (${contentType})`;
  } catch (error) {
    reason = `could not be reached (${error instanceof Error ? error.message : String(error)})`;
  }

  throw new Error(
    `${url} ${reason}.\n` +
      'A "next dev" left running for hours can lose its render worker and answer 500 on ' +
      'every route, including /api/auth/*. The suite then runs against a server that is ' +
      'listening but no longer serving: sign-in fails, and each project depending on the ' +
      'setup project reports "did not run".\n' +
      'Restart the dev server, then re-run the E2E suite.'
  );
}
