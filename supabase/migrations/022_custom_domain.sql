-- Phase 4: custom domain per org for white-label status pages
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Fast lookup from middleware
CREATE INDEX IF NOT EXISTS organizations_custom_domain_idx
  ON organizations (custom_domain)
  WHERE custom_domain IS NOT NULL;
