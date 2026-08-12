import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sparticuz/chromium resolves its binary via relative fs/path lookups at runtime, not a
  // static import graph — bundling it breaks those lookups, so keep it external...
  serverExternalPackages: ['@sparticuz/chromium', '@francoisnoel62/grammalecte'],
  // ...and being external isn't enough on its own: @vercel/nft's static analysis misses the
  // compressed binaries under bin/ (loaded via a dynamic fs.readdir, not a traceable require),
  // so force them in explicitly. Scoped to the routes that actually launch Chromium — the
  // ~67MB bin/ folder would otherwise bloat every unrelated function's deployment bundle.
  outputFileTracingIncludes: {
    '/book-preview': [
      './node_modules/@sparticuz/chromium/**/*',
      './public/vendor/paged.polyfill.min.js',
    ],
    '/editor': [
      './node_modules/@sparticuz/chromium/**/*',
      './public/vendor/paged.polyfill.min.js',
      // Grammalecte loads generated rules and dictionaries with runtime fs lookups.
      './node_modules/@francoisnoel62/grammalecte/_build/nodejs/fr/core/**/*',
      // The adjacent spell checker uses the same lazy dictionary loading pattern.
      './node_modules/dictionary-fr/**/*',
    ],
    // Declaring a word compiles the project's dictionary with Graphspell's automaton
    // builder, which is read from disk rather than imported (it ships as a
    // browser-worker script with no module exports). Only the builder and the two
    // modules it requires are needed here — not the ~25MB of generated dictionaries
    // the editor's engine loads.
    '/project/[projectId]/cockpit/settings': [
      './node_modules/@francoisnoel62/grammalecte/_build/nodejs/fr/core/grammalecte/graphspell/dawg.js',
      './node_modules/@francoisnoel62/grammalecte/_build/nodejs/fr/core/grammalecte/graphspell/helpers.js',
      './node_modules/@francoisnoel62/grammalecte/_build/nodejs/fr/core/grammalecte/graphspell/str_transform.js',
      './node_modules/@francoisnoel62/grammalecte/_build/nodejs/fr/core/grammalecte/graphspell/char_player.js',
    ],
    '/api/paged-spike/export': [
      './node_modules/@sparticuz/chromium/**/*',
      './public/vendor/paged.polyfill.min.js',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Support large document imports
    },
  },
};

export default nextConfig;
