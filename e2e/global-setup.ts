// ABOUTME: Playwright global setup — seeds MongoDB with test fixtures for ai-strategy tests
// ABOUTME: Runs once before all Playwright tests; matched teardown in global-teardown.ts

import { seedAll, cleanupAll } from './helpers/seed';

export default async function globalSetup(): Promise<void> {
  // Remove any leftover data from a previous interrupted run
  await cleanupAll();
  // Seed fresh test fixtures
  await seedAll();
}
