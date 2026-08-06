// ABOUTME: Vitest configuration for the wall-clock performance benchmarks
// ABOUTME: Runs them alone, so the durations measure the code and not CPU contention

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// The benchmarks in tests/performance assert on elapsed milliseconds. Run inside the
// main suite they share 20 cores with 361 other files, and the large-DOCX import
// crosses its 5s budget on scheduling alone. This config runs them on their own so a
// failure means the code got slower — which is the only thing they are worth asserting.
// Settings are spelled out rather than merged with vitest.config.ts: mergeConfig
// concatenates arrays, which would pull the whole unit suite back in via `include`.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['tests/performance/**/*.test.{ts,tsx}'],
    exclude: ['node_modules'],
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
