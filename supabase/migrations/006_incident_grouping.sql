-- Add error_signature + incident_id to synced_executions
alter table synced_executions
  add column if not exists error_signature text,
  add column if not exists incident_id uuid references incidents(id) on delete set null;

create index if not exists synced_executions_incident_idx on synced_executions (incident_id);
create index if not exists synced_executions_sig_idx on synced_executions (org_id, error_signature);

-- Add error_signature + node_name to incidents (for signature-based grouping)
alter table incidents
  add column if not exists error_signature text,
  add column if not exists node_name text;

create index if not exists incidents_sig_idx on incidents (org_id, error_signature, status, last_seen_at desc);
