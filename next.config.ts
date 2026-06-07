import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is ONLY for the container image (the Dockerfile sets
  // BUILD_STANDALONE=true). It breaks plain `next start`, so locally we leave it off
  // and `npm run build && npm start` works normally.
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
};

export default nextConfig;
