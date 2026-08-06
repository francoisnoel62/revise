// ABOUTME: Playwright global setup — seeds MongoDB with test fixtures for ai-strategy tests
// ABOUTME: Runs once before all Playwright tests; matched teardown in global-teardown.ts

import { seedAll, cleanupAll } from './helpers/seed';
import { assertServerHealthy } from './helpers/server-health';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

async function warmUpServer(): Promise<void> {
  // Pre-fetch pages so Next.js JIT compilation completes before parallel workers start.
  // Without this, multiple workers requesting uncompiled pages simultaneously can all
  // exceed the 60-second timeout waiting for the same compilation to finish.
  //
  // Only public routes can be warmed here: /editor and the cockpit redirect to signin
  // without the cookie auth.setup produces later, so warming them compiles the
  // middleware rather than the page, and their first real hit still pays for the
  // compile. That is why the tests reaching them carry their own generous timeouts.
  const pages = ['/', '/auth/signin', '/dashboard', '/editor/paged-spike', '/book-preview'];
  await Promise.allSettled(pages.map((path) => fetch(`${BASE_URL}${path}`)));
}

export default async function globalSetup(): Promise<void> {
  // First: refuse to run at all against a server that is listening but not serving.
  // warmUpServer cannot catch that — Promise.allSettled swallows every failure, and a
  // 500 is not a rejection anyway, so the suite would seed and launch regardless.
  await assertServerHealthy(BASE_URL);
  // Remove any leftover data from a previous interrupted run
  await cleanupAll();
  // Seed fresh test fixtures
  await seedAll();
  // Warm up Next.js JIT cache before parallel workers start
  await warmUpServer();
}
