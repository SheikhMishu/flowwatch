-- Track processed Stripe webhook event IDs to prevent duplicate handling.
-- event_id is the Stripe event ID (e.g. evt_xxx), unique per delivery attempt.
CREATE TABLE stripe_processed_events (
  event_id    TEXT        PRIMARY KEY,
  event_type  TEXT        NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-clean events older than 90 days (Stripe retries window is ~3 days)
CREATE INDEX stripe_processed_events_processed_at_idx
  ON stripe_processed_events (processed_at);
