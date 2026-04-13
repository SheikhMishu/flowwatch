-- Track the most recent failed execution per incident (used for retry button)
alter table incidents
  add column if not exists last_n8n_execution_id text;
