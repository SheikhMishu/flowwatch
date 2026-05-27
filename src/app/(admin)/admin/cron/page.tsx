import { getServerDb } from "@/lib/db";
import { CronClient } from "./cron-client";

export const dynamic = "force-dynamic";

export type InstanceStatus = {
  instance_id: string;
  org_id: string;
  org_name: string;
  instance_name: string;
  instance_url: string;
  is_active: boolean;
  last_synced_at: string | null;
  last_run_ok: boolean | null;
  last_workflows_upserted: number | null;
  last_executions_upserted: number | null;
  last_error_message: string | null;
  last_run_at: string | null;
  last_triggered_by: string | null;
  last_duration_ms: number | null;
};

export type BatchSummary = {
  batch_id: string;
  run_at: string;
  triggered_by: string;
  total_instances: number;
  succeeded: number;
  failed: number;
  total_workflows: number;
  total_executions: number;
  avg_duration_ms: number | null;
};

export type BatchRun = {
  batch_id: string;
  instance_id: string | null;
  org_id: string | null;
  ok: boolean;
  workflows_upserted: number;
  executions_upserted: number;
  error_message: string | null;
  duration_ms: number | null;
  triggered_by: string;
};

export default async function AdminCronPage() {
  const db = getServerDb();

  const [
    { data: instanceStatusRaw },
    { data: recentBatchesRaw },
    { data: batchRunsRaw },
  ] = await Promise.all([
    db.rpc("admin_cron_instance_status"),
    db.rpc("admin_cron_recent_batches", { p_limit: 30 }),
    db
      .from("cron_sync_runs")
      .select("batch_id, instance_id, org_id, ok, workflows_upserted, executions_upserted, error_message, duration_ms, triggered_by")
      .order("run_at", { ascending: false })
      .limit(500),
  ]);

  const instanceStatus = ((instanceStatusRaw as InstanceStatus[] | null) ?? []).map((r) => ({
    ...r,
    last_workflows_upserted: Number(r.last_workflows_upserted ?? 0),
    last_executions_upserted: Number(r.last_executions_upserted ?? 0),
    last_duration_ms: r.last_duration_ms != null ? Number(r.last_duration_ms) : null,
  }));

  const recentBatches = ((recentBatchesRaw as BatchSummary[] | null) ?? []).map((r) => ({
    ...r,
    total_instances: Number(r.total_instances),
    succeeded: Number(r.succeeded),
    failed: Number(r.failed),
    total_workflows: Number(r.total_workflows),
    total_executions: Number(r.total_executions),
    avg_duration_ms: r.avg_duration_ms != null ? Number(r.avg_duration_ms) : null,
  }));

  const batchRuns = (batchRunsRaw as BatchRun[] | null) ?? [];

  return (
    <CronClient
      instanceStatus={instanceStatus}
      recentBatches={recentBatches}
      batchRuns={batchRuns}
    />
  );
}
