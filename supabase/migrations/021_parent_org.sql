-- Migration 021: parent org relationship for agency/multi-client support
-- Allows one org to be the "agency" that manages multiple client workspaces.
-- parent_org_id is nullable — existing orgs and solo workspaces are unaffected.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS parent_org_id UUID
    REFERENCES public.organizations(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orgs_parent_idx ON public.organizations (parent_org_id);
