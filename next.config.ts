import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sparticuz/chromium resolves its binary via relative fs/path lookups at runtime, not a
  // static import graph — bundling it breaks those lookups, so keep it external...
  serverExternalPackages: ['@sparticuz/chromium'],
  // ...and being external isn't enough on its own: @vercel/nft's static analysis misses the
  // compressed binaries under bin/ (loaded via a dynamic fs.readdir, not a traceable require),
  // so force them in explicitly. Scoped to the routes that actually launch Chromium — the
  // ~67MB bin/ folder would otherwise bloat every unrelated function's deployment bundle.
  outputFileTracingIncludes: {
    '/book-preview': ['./node_modules/@sparticuz/chromium/**/*'],
    '/editor': ['./node_modules/@sparticuz/chromium/**/*'],
    '/api/paged-spike/export': ['./node_modules/@sparticuz/chromium/**/*'],
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
