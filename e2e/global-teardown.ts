// ABOUTME: Playwright global teardown — removes all e2e test fixtures from MongoDB
// ABOUTME: Runs once after all Playwright tests complete

import { cleanupAll } from './helpers/seed';

export default async function globalTeardown(): Promise<void> {
  await cleanupAll();
}
