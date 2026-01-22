import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Support large document imports
    },
    turbopackUseSystemTlsCerts: true,
  },
};

export default nextConfig;
