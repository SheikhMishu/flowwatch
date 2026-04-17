-- Migration 010: Public Status Page
-- Adds slug and status_page_enabled to organizations

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status_page_enabled BOOLEAN NOT NULL DEFAULT false;

-- Index for fast slug lookup on public page
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations (slug) WHERE slug IS NOT NULL;
