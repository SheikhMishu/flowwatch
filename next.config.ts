import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Exclude all files from output file tracing — avoids a Windows race condition
  // on .nft.json files in Next.js 15. Safe to remove for Vercel/Linux deployments.
  outputFileTracingExcludes: { "*": ["**"] },
};

export default nextConfig;
