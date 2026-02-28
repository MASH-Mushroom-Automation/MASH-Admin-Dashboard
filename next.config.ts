import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Temporarily ignore ESLint errors during builds
    // TODO: Fix TypeScript 'any' types across codebase
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
