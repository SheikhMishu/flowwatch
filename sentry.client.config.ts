import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "https://dd3a2439297511aebc764a88e5155512@o4511363800629248.ingest.us.sentry.io/4511363807182848",
  environment: process.env.NODE_ENV,
  // Capture 10% of sessions for performance tracing in prod; 100% locally
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Replay 1% of sessions, 100% of sessions with an error
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
});
