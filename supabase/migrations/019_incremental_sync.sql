-- Track the highest execution ID synced per instance.
-- NULL = no sync run yet; instance will do a full 90-day sweep on first sync.
-- Once set, each sync only fetches executions with ID > this value (incremental).
alter table n8n_instances
  add column if not exists last_execution_id bigint;
