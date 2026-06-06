// ABOUTME: Playwright auth setup — logs in the E2E test user and saves session storageState
// ABOUTME: Runs once per test session before the ai-strategy project tests

import { test as setup } from '@playwright/test';
import path from 'path';
import { TEST_USER_EMAIL, TEST_USER_PASSWORD } from './helpers/seed';

export const AUTH_FILE = path.join(__dirname, '.auth', 'user.json');

setup('authenticate test user', async ({ page }) => {
  await page.goto('/auth/signin');

  await page.locator('input[name="email"]').fill(TEST_USER_EMAIL);
  await page.locator('input[name="password"]').fill(TEST_USER_PASSWORD);
  await page.getByRole('button', { name: /se connecter/i }).click();

  // Wait for redirect to dashboard after successful login
  await page.waitForURL('/dashboard', { timeout: 15_000 });

  // Persist the session for subsequent tests
  await page.context().storageState({ path: AUTH_FILE });
});
