// Background sync: pulls n8n data into Supabase
// Used by the Vercel Cron (/api/cron/sync) and manual sync (/api/sync/[instanceId])

import { getServerDb } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { N8nClient, type N8nExecutionRaw } from "@/lib/n8n";
import { evaluateOrgAlerts } from "@/lib/alert-engine";
import { processErrorExecutions, autoResolveIncidents } from "@/lib/incident-grouping";
import { logger } from "@/lib/logger";

export interface SyncResult {
  instanceId: string;
  ok: boolean;
  error?: string;
  workflowsUpserted: number;
  executionsUpserted: number;
  duration_ms?: number;
}

// ─── Core sync logic ──────────────────────────────────────────────────────────

async function runInstanceSync(
  db: ReturnType<typeof getServerDb>,
  orgId: string,
  instanceId: string,
  instanceUrl: string,
  apiKeyEncrypted: string,
  lastExecutionId: number | null
): Promise<SyncResult> {
  let apiKey: string;
  try {
    apiKey = decrypt(apiKeyEncrypted);
  } catch {
    return { instanceId, ok: false, error: "Failed to decrypt API key", workflowsUpserted: 0, executionsUpserted: 0 };
  }

  const client = new N8nClient(instanceUrl, apiKey);

  try {
    // Three-layer fetch strategy:
    //
    // 1. recentExecutions (always): last 100 executions. Catches running→success transitions
    //    and any activity from the current sync window. Skipped on first sync since the
    //    initial sweep already covers these.
    //
    // 2. deltaExecutions: all executions newer than our cursor (incremental), OR a full
    //    90-day / 2000-execution sweep when no cursor exists yet (initial sync).
    //
    // Results are merged by execution ID; recentExecutions wins on conflict so we always
    // have the freshest status for any execution in both sets.

    const isFirstSync = lastExecutionId === null;

    const [rawWorkflows, recentExecutions, deltaExecutions] = await Promise.all([
      client.getWorkflows(),
      isFirstSync ? Promise.resolve([] as N8nExecutionRaw[]) : client.getExecutions({ limit: 100 }),
      client.getExecutionsSince(lastExecutionId, { maxPages: 20 }).catch((err) => {
        // Graceful degradation: if pagination fails (e.g. older n8n without lastId support),
        // recentExecutions still provides coverage. Cursor stays unchanged so next sync retries.
        logger.warn("Incremental execution fetch failed, falling back to recent-only", { category: "sync", orgId, instanceId, err });
        return [] as N8nExecutionRaw[];
      }),
    ]);

    // Merge: delta first, then recent overwrites for fresher status on overlapping IDs
    const execById = new Map<string, N8nExecutionRaw>();
    for (const e of deltaExecutions) execById.set(String(e.id), e);
    for (const e of recentExecutions) execById.set(String(e.id), e);

    // Re-poll in-flight executions that are > 2 min old and therefore won't appear in
    // either set above (e.g., a long-running execution on a very busy instance where 100+
    // newer executions have completed since the last sync cycle).
    const { data: staleInFlight } = await db
      .from("synced_executions")
      .select("n8n_execution_id")
      .eq("instance_id", instanceId)
      .in("status", ["running", "waiting"])
      .lt("started_at", new Date(Date.now() - 2 * 60 * 1000).toISOString());

    if (staleInFlight && staleInFlight.length > 0) {
      const pollResults = await Promise.allSettled(
        staleInFlight.slice(0, 10).map((inf) => client.getExecutionWithData(inf.n8n_execution_id))
      );
      for (const r of pollResults) {
        if (r.status === "fulfilled") execById.set(String(r.value.id), r.value);
      }
    }

    const rawExecutions = [...execById.values()];

    // Upsert workflow snapshots
    const workflowRows = rawWorkflows.map((w) => ({
      org_id: orgId,
      instance_id: instanceId,
      n8n_workflow_id: w.id,
      name: w.name,
      is_active: w.active,
      node_count: (w.nodes ?? []).length,
      tags: (w.tags ?? []).map((t) => t.name).filter(Boolean),
      updated_at: new Date().toISOString(),
    }));

    if (workflowRows.length > 0) {
      const { error: wfErr } = await db.from("workflow_snapshots").upsert(workflowRows, {
        onConflict: "instance_id,n8n_workflow_id",
      });
      if (wfErr) logger.error("workflow_snapshots upsert error", { category: "sync", orgId, instanceId, err: wfErr });
    }

    // Build workflow name map
    const nameMap = Object.fromEntries(rawWorkflows.map((w) => [w.id, w.name]));

    function normalizeStatus(s: string): string {
      const valid = ["success", "error", "running", "waiting", "canceled"];
      return valid.includes(s) ? s : "error";
    }

    function normalizeMode(m: string): string {
      const valid = ["manual", "trigger", "webhook", "retry"];
      return valid.includes(m) ? m : "trigger";
    }

    // Fetch error details for the most recent failed executions (cap at 25 to avoid timeout)
    const errorExecs = rawExecutions
      .filter((e) => e.status === "error" || e.status === "crashed")
      .slice(0, 25);
    const errorDetailMap = new Map<string, { failed_node: string | null; error_message: string | null; error_type: string | null }>();
    await Promise.all(
      errorExecs.map(async (e) => {
        try {
          const full = await client.getExecutionWithData(String(e.id));
          const topError = full.data?.resultData?.error;
          const runData = full.data?.resultData?.runData ?? {};
          const failedNodeFromRun = Object.entries(runData).find(([, runs]) => runs[0]?.error)?.[0] ?? null;
          errorDetailMap.set(String(e.id), {
            failed_node: topError?.node?.name ?? failedNodeFromRun,
            error_message: topError?.message ?? null,
            error_type: topError?.name ?? null,
          });
        } catch {
          // non-critical — leave nulls if fetch fails
        }
      })
    );

    // Upsert executions — update on conflict so "running" → "success" transitions are captured
    const execRows = rawExecutions
      .filter((e) => e.startedAt || e.stoppedAt)
      .map((e) => {
        const errorDetail = errorDetailMap.get(String(e.id));
        return {
          org_id: orgId,
          instance_id: instanceId,
          n8n_execution_id: String(e.id),
          n8n_workflow_id: e.workflowId,
          workflow_name: nameMap[e.workflowId] ?? e.workflowName ?? "Unknown Workflow",
          status: normalizeStatus(e.status),
          mode: normalizeMode(e.mode),
          started_at: e.startedAt ?? e.stoppedAt,
          finished_at: e.stoppedAt ?? null,
          duration_ms: (() => {
            if (!e.stoppedAt || !e.startedAt) return null;
            const d = new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime();
            return d > 0 && d < 86_400_000 * 30 ? d : null;
          })(),
          failed_node: errorDetail?.failed_node ?? null,
          error_message: errorDetail?.error_message ?? null,
          error_type: errorDetail?.error_type ?? null,
        };
      });

    logger.info("Instance sync data fetched", {
      category: "sync",
      orgId,
      instanceId,
      workflows: rawWorkflows.length,
      executions: rawExecutions.length,
      isIncremental: !isFirstSync,
    });

    if (execRows.length > 0) {
      const { error: execErr } = await db.from("synced_executions").upsert(execRows, {
        onConflict: "instance_id,n8n_execution_id",
      });
      if (execErr) logger.error("synced_executions upsert error", { category: "sync", orgId, instanceId, err: execErr });
    }

    // Advance cursor to the highest execution ID seen — never regress
    const newMaxId = rawExecutions.reduce((max, e) => Math.max(max, e.id), lastExecutionId ?? 0);
    const cursorAdvanced = newMaxId > (lastExecutionId ?? 0);

    await db
      .from("n8n_instances")
      .update({
        last_synced_at: new Date().toISOString(),
        ...(cursorAdvanced ? { last_execution_id: newMaxId } : {}),
      })
      .eq("id", instanceId);

    logger.info("Instance sync complete", {
      category: "sync",
      orgId,
      instanceId,
      workflowsUpserted: workflowRows.length,
      executionsUpserted: execRows.length,
      newCursor: newMaxId,
    });

    return {
      instanceId,
      ok: true,
      workflowsUpserted: workflowRows.length,
      executionsUpserted: execRows.length,
    };
  } catch (err) {
    logger.error("Instance sync failed", { category: "sync", orgId, instanceId, err });
    return {
      instanceId,
      ok: false,
      error: err instanceof Error ? err.message : "Sync failed",
      workflowsUpserted: 0,
      executionsUpserted: 0,
    };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Sync a single instance (manual trigger). Verifies org ownership. Evaluates alerts after sync. */
export async function syncInstance(instanceId: string, orgId: string): Promise<SyncResult> {
  const db = getServerDb();

  const { data: inst } = await db
    .from("n8n_instances")
    .select("id, url, api_key_encrypted, last_execution_id")
    .eq("id", instanceId)
    .eq("org_id", orgId)
    .eq("is_active", true)
    .single();

  if (!inst) {
    return { instanceId, ok: false, error: "Instance not found", workflowsUpserted: 0, executionsUpserted: 0 };
  }

  const lastExecutionId = inst.last_execution_id != null ? Number(inst.last_execution_id) : null;

  logger.info("syncInstance started", { category: "sync", orgId, instanceId, isIncremental: lastExecutionId !== null });
  const t0 = Date.now();
  const result = await runInstanceSync(db, orgId, instanceId, inst.url, inst.api_key_encrypted, lastExecutionId);
  const duration_ms = Date.now() - t0;
  const timedResult = { ...result, duration_ms };

  writeSyncRuns(db, crypto.randomUUID(), "manual", [{ ...timedResult, orgId }]).catch(() => {});

  if (result.ok) {
    await Promise.all([
      evaluateOrgAlerts(orgId).catch((err) =>
        logger.error("Alert evaluation failed after sync", { category: "sync", orgId, instanceId, err })
      ),
      processErrorExecutions(db, orgId, instanceId).catch((err) =>
        logger.error("Incident grouping failed after sync", { category: "sync", orgId, instanceId, err })
      ),
    ]);
    await autoResolveIncidents(db, orgId).catch((err) =>
      logger.error("Incident auto-resolve failed after sync", { category: "sync", orgId, instanceId, err })
    );
  }

  return timedResult;
}

/** Sync all active instances across all orgs (cron). Evaluates alerts per org after sync. */
export async function syncAllInstances(): Promise<SyncResult[]> {
  const db = getServerDb();

  const { data: instances } = await db
    .from("n8n_instances")
    .select("id, org_id, url, api_key_encrypted, last_execution_id")
    .eq("is_active", true);

  if (!instances || instances.length === 0) return [];

  const batchId = crypto.randomUUID();
  const results = await Promise.all(
    instances.map(async (inst) => {
      const lastExecutionId = inst.last_execution_id != null ? Number(inst.last_execution_id) : null;
      const t0 = Date.now();
      const r = await runInstanceSync(db, inst.org_id, inst.id, inst.url, inst.api_key_encrypted, lastExecutionId);
      return { ...r, orgId: inst.org_id, duration_ms: Date.now() - t0 };
    })
  );

  writeSyncRuns(db, batchId, "cron", results).catch(() => {});

  // Post-sync steps once per org (alerts, incident grouping, auto-resolve)
  const succeededInstances = results
    .filter((r) => r.ok)
    .map((r) => instances.find((i) => i.id === r.instanceId))
    .filter(Boolean) as typeof instances;

  const orgIds = [...new Set(succeededInstances.map((i) => i.org_id))];

  await Promise.all(
    orgIds.map((orgId) =>
      evaluateOrgAlerts(orgId).catch((err) =>
        logger.error("Alert evaluation failed after cron sync", { category: "sync", orgId, err })
      )
    )
  );

  await Promise.all(
    succeededInstances.map((inst) =>
      processErrorExecutions(db, inst.org_id, inst.id).catch((err) =>
        logger.error("Incident grouping failed after cron sync", { category: "sync", orgId: inst.org_id, instanceId: inst.id, err })
      )
    )
  );

  await Promise.all(
    orgIds.map((orgId) =>
      autoResolveIncidents(db, orgId).catch((err) =>
        logger.error("Incident auto-resolve failed after cron sync", { category: "sync", orgId, err })
      )
    )
  );

  return results.map(({ orgId: _orgId, ...r }) => r);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function writeSyncRuns(
  db: ReturnType<typeof getServerDb>,
  batchId: string,
  triggeredBy: "cron" | "manual",
  results: Array<SyncResult & { orgId: string; duration_ms: number }>
) {
  const rows = results.map((r) => ({
    batch_id: batchId,
    triggered_by: triggeredBy,
    instance_id: r.instanceId,
    org_id: r.orgId,
    ok: r.ok,
    workflows_upserted: r.workflowsUpserted,
    executions_upserted: r.executionsUpserted,
    error_message: r.error ?? null,
    duration_ms: r.duration_ms,
  }));
  const { error } = await db.from("cron_sync_runs").insert(rows);
  if (error) logger.error("Failed to write cron_sync_runs", { category: "cron", err: error });
}
