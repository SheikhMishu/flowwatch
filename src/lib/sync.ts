// Background sync: pulls n8n data into Supabase
// Used by the Vercel Cron (/api/cron/sync) and manual sync (/api/sync/[instanceId])

import { getServerDb } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { N8nClient } from "@/lib/n8n";
import { evaluateOrgAlerts } from "@/lib/alert-engine";
import { processErrorExecutions, autoResolveIncidents } from "@/lib/incident-grouping";
import { logger } from "@/lib/logger";
export interface SyncResult {
  instanceId: string;
  ok: boolean;
  error?: string;
  workflowsUpserted: number;
  executionsUpserted: number;
}

// ─── Core sync logic ──────────────────────────────────────────────────────────

async function runInstanceSync(
  db: ReturnType<typeof getServerDb>,
  orgId: string,
  instanceId: string,
  instanceUrl: string,
  apiKeyEncrypted: string
): Promise<SyncResult> {
  let apiKey: string;
  try {
    apiKey = decrypt(apiKeyEncrypted);
  } catch {
    return { instanceId, ok: false, error: "Failed to decrypt API key", workflowsUpserted: 0, executionsUpserted: 0 };
  }

  const client = new N8nClient(instanceUrl, apiKey);

  try {
    const [rawWorkflows, rawExecutions] = await Promise.all([
      client.getWorkflows(),
      client.getExecutions({ limit: 250 }),
    ]);

    // Upsert workflow snapshots
    const workflowRows = rawWorkflows.map((w) => ({
      org_id: orgId,
      instance_id: instanceId,
      n8n_workflow_id: w.id,
      name: w.name,
      is_active: w.active,
      node_count: (w.nodes ?? []).length,
      tags: (w.tags ?? []).map((t) => t.name),
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

    // Fetch error details for failed executions (list endpoint doesn't include them)
    const errorExecs = rawExecutions.filter((e) => e.status === "error" || e.status === "crashed");
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
    const execRows = rawExecutions.map((e) => {
      const errorDetail = errorDetailMap.get(String(e.id));
      return {
        org_id: orgId,
        instance_id: instanceId,
        n8n_execution_id: String(e.id),
        n8n_workflow_id: e.workflowId,
        workflow_name: nameMap[e.workflowId] ?? e.workflowName ?? "Unknown Workflow",
        status: normalizeStatus(e.status),
        mode: normalizeMode(e.mode),
        started_at: e.startedAt,
        finished_at: e.stoppedAt ?? null,
        duration_ms: e.stoppedAt
          ? new Date(e.stoppedAt).getTime() - new Date(e.startedAt).getTime()
          : null,
        failed_node: errorDetail?.failed_node ?? null,
        error_message: errorDetail?.error_message ?? null,
        error_type: errorDetail?.error_type ?? null,
      };
    });

    logger.info("Instance sync data fetched", { category: "sync", orgId, instanceId, workflows: rawWorkflows.length, executions: rawExecutions.length });

    if (execRows.length > 0) {
      const { error: execErr } = await db.from("synced_executions").upsert(execRows, {
        onConflict: "instance_id,n8n_execution_id",
      });
      if (execErr) logger.error("synced_executions upsert error", { category: "sync", orgId, instanceId, err: execErr });
    }

    // Update last_synced_at
    await db
      .from("n8n_instances")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", instanceId);

    logger.info("Instance sync complete", { category: "sync", orgId, instanceId, workflowsUpserted: workflowRows.length, executionsUpserted: execRows.length });
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
    .select("id, url, api_key_encrypted")
    .eq("id", instanceId)
    .eq("org_id", orgId)
    .eq("is_active", true)
    .single();

  if (!inst) {
    return { instanceId, ok: false, error: "Instance not found", workflowsUpserted: 0, executionsUpserted: 0 };
  }

  logger.info("syncInstance started", { category: "sync", orgId, instanceId });
  const result = await runInstanceSync(db, orgId, instanceId, inst.url, inst.api_key_encrypted);

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

  return result;
}

/** Sync all active instances across all orgs (cron). Evaluates alerts per org after sync. */
export async function syncAllInstances(): Promise<SyncResult[]> {
  const db = getServerDb();

  const { data: instances } = await db
    .from("n8n_instances")
    .select("id, org_id, url, api_key_encrypted")
    .eq("is_active", true);

  if (!instances || instances.length === 0) return [];

  const results = await Promise.all(
    instances.map((inst) =>
      runInstanceSync(db, inst.org_id, inst.id, inst.url, inst.api_key_encrypted)
    )
  );

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

  return results;
}
