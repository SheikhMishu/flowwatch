-- PIN brute-force protection
-- Tracks failed verify attempts per PIN. After 5 failures the PIN is invalidated.
-- Applied: April 2026

ALTER TABLE pin_verifications
  ADD COLUMN IF NOT EXISTS failed_attempts int NOT NULL DEFAULT 0;
