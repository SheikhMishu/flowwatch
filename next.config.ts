import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Exclude all files from output file tracing — avoids a Windows race condition
  // on .nft.json files in Next.js 15. Safe to remove for Vercel/Linux deployments.
  outputFileTracingExcludes: { "*": ["**"] },
  webpack: (config) => {
    // pino uses worker threads for transports; mark as external so webpack
    // doesn't try to bundle them (they're not used in production anyway)
    config.externals = config.externals ?? [];
    (config.externals as string[]).push("pino-pretty", "thread-stream");
    return config;
  },
};

export default nextConfig;
