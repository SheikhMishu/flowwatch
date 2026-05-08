-- duration_ms overflows integer when startedAt is null/epoch on some n8n instances
-- (e.g. stoppedAt_ms - 0 = ~1.7 trillion, exceeds integer max of 2,147,483,647)
alter table synced_executions alter column duration_ms type bigint;
