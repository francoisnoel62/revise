// ABOUTME: Vitest configuration for running tests with React and jsdom environment
// ABOUTME: Enables path aliases and configures test environment for Next.js components

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local for integration tests
dotenv.config({ path: '.env.local' });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    // Benchmarks are excluded here and run alone via vitest.performance.config.ts:
    // their assertions are wall-clock, so they need a quiet machine to mean anything.
    exclude: [
      'node_modules',
      '**/*.integration.test.{ts,tsx}',
      'tests/performance/**',
    ],
    // The suite runs hundreds of jsdom files in parallel, and some first tests
    // pay for a lazily loaded engine (the French grammar dictionary alone takes
    // ~18s to import). The 5s default expires on setup, not on the assertions.
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
