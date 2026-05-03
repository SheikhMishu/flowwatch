import type { NextConfig } from "next";

const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' https://fonts.gstatic.com",
  // Allow Supabase, Stripe, and any other HTTPS API connections
  "connect-src 'self' https:",
  // Stripe renders card inputs inside iframes served from these origins
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-site",
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    // pino uses worker threads for transports; mark as external so webpack
    // doesn't try to bundle them (they're not used in production anyway)
    config.externals = config.externals ?? [];
    (config.externals as string[]).push("pino-pretty", "thread-stream");
    return config;
  },
};

export default nextConfig;
