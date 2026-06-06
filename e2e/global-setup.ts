// ABOUTME: Playwright global setup — seeds MongoDB with test fixtures for ai-strategy tests
// ABOUTME: Runs once before all Playwright tests; matched teardown in global-teardown.ts

import { seedAll, cleanupAll } from './helpers/seed';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

async function warmUpServer(): Promise<void> {
  // Pre-fetch pages so Next.js JIT compilation completes before parallel workers start.
  // Without this, multiple workers requesting uncompiled pages simultaneously can all
  // exceed the 60-second timeout waiting for the same compilation to finish.
  const pages = ['/', '/auth/signin', '/dashboard'];
  await Promise.allSettled(pages.map((path) => fetch(`${BASE_URL}${path}`)));
}

export default async function globalSetup(): Promise<void> {
  // Remove any leftover data from a previous interrupted run
  await cleanupAll();
  // Seed fresh test fixtures
  await seedAll();
  // Warm up Next.js JIT cache before parallel workers start
  await warmUpServer();
}
