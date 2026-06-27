// ABOUTME: Isolated Playwright configuration for the paged-renderer spike.
// ABOUTME: Exercises preview and PDF export without database-backed setup.

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/paged-spike',
  workers: 1,
  reporter: 'line',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/editor/paged-spike',
    reuseExistingServer: true,
  },
});
