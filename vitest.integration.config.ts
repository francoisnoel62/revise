// ABOUTME: Vitest configuration for integration tests that require real infrastructure (DB, etc.)
// ABOUTME: Uses node environment and includes *.integration.test.* files excluded by the main config

import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.integration.test.{ts,tsx}'],
    exclude: ['node_modules'],
    // Externalised dependencies are resolved by Node, which ignores the aliases below.
    // next-auth has to go through Vite for its extensionless 'next/server' import to be
    // rewritten, otherwise no Server Action can be loaded here at all.
    server: {
      deps: {
        inline: [/next-auth/, /@auth\//],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // next-auth reaches for 'next/server' without its extension, which Node's ESM
      // resolver refuses. Next's own bundler papers over this; Vitest does not, and the
      // import chain dies before any Server Action can be loaded. Point it at the file.
      'next/server': path.resolve(__dirname, './node_modules/next/server.js'),
    },
  },
});
