import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sparticuz/chromium ships a compressed Chromium binary resolved at runtime via fs/path,
  // not a static import graph — keep it unbundled so Next's output tracing picks up the
  // binary file instead of a webpack-transformed module.
  serverExternalPackages: ['@sparticuz/chromium'],
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
