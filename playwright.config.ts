// ABOUTME: Playwright configuration for end-to-end testing
// ABOUTME: Defines test environment and browser settings

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, 'e2e', '.auth', 'user.json');

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: 'html',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // ── Existing unauthenticated tests ──────────────────────────────────────
    {
      name: 'chromium',
      testMatch: /e2e\/[^/]+\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Paged-spike tests (parity + live pagination + PDF export) ───────────
    {
      name: 'paged-spike',
      testMatch: /paged-spike\/.+\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Auth setup : login → save storageState ──────────────────────────────
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── AI strategy tests : headed, authenticated ───────────────────────────
    {
      name: 'ai-strategy',
      testMatch: /ai-strategy\/.+\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
        headless: !!process.env.CI,
        launchOptions: { slowMo: process.env.CI ? 0 : 250 },
        actionTimeout: 30_000,
        navigationTimeout: 45_000,
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
