// Server-side n8n data fetching helpers
// Strategy: read from synced_executions / workflow_snapshots in Supabase when available,
// fall back to live n8n API for orgs that haven't synced yet.

import { getServerDb } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { N8nClient, toWorkflow, toExecution, toExecutionFull, computeStats, enrichWorkflowsWithStats } from "@/lib/n8n";
import type { Workflow, Execution, DashboardStats, TrendPoint } from "@/types";

interface StoredInstance {
  id: string;
  name: string;
  url: string;
  api_key_encrypted: string;
  last_synced_at: string | null;
}

async function getOrgInstances(orgId: string, instanceId?: string): Promise<StoredInstance[]> {
  const db = getServerDb();
  let query = db
    .from("n8n_instances")
    .select("id, name, url, api_key_encrypted, last_synced_at")
    .eq("org_id", orgId)
    .eq("is_active", true);
  if (instanceId) query = query.eq("id", instanceId);
  const { data } = await query;
  return (data ?? []) as StoredInstance[];
}

function makeClient(inst: StoredInstance): N8nClient | null {
  try {
    const apiKey = decrypt(inst.api_key_encrypted);
    return new N8nClient(inst.url, apiKey);
  } catch {
    return null;
  }
}

// ─── DB readers ───────────────────────────────────────────────────────────────

async function fetchOrgExecutionsFromDB(orgId: string, instanceId?: string): Promise<Execution[]> {
  const db = getServerDb();
  let query = db
    .from("synced_executions")
    .select("*")
    .eq("org_id", orgId)
    .order("started_at", { ascending: false })
    .limit(200);
  if (instanceId) query = query.eq("instance_id", instanceId);
  const { data } = await query;
  if (!data || data.length === 0) return [];

  return data.map((row) => ({
    id: `${row.instance_id}:${row.n8n_execution_id}`,
    instance_id: row.instance_id,
    workflow_id: `${row.instance_id}:${row.n8n_workflow_id}`,
    workflow_name: row.workflow_name,
    n8n_execution_id: row.n8n_execution_id,
    status: row.status as Execution["status"],
    started_at: row.started_at,
    finished_at: row.finished_at,
    duration_ms: row.duration_ms,
    failed_node: row.failed_node,
    error_message: row.error_message,
    error_type: row.error_type,
    mode: row.mode as Execution["mode"],
  }));
}

async function fetchOrgWorkflowsFromDB(orgId: string, instanceId?: string): Promise<Workflow[]> {
  const db = getServerDb();

  let wfQuery = db.from("workflow_snapshots").select("*").eq("org_id", orgId);
  if (instanceId) wfQuery = wfQuery.eq("instance_id", instanceId);
  const { data: wfData } = await wfQuery;
  if (!wfData || wfData.length === 0) return [];

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let exQuery = db
    .from("synced_executions")
    .select("instance_id, n8n_workflow_id, status, started_at, duration_ms")
    .eq("org_id", orgId)
    .gte("started_at", since24h);
  if (instanceId) exQuery = exQuery.eq("instance_id", instanceId);
  const { data: exData } = await exQuery;
  const recentExecs = exData ?? [];

  return wfData.map((wf) => {
    const wfExecs = recentExecs.filter(
      (e) => e.instance_id === wf.instance_id && e.n8n_workflow_id === wf.n8n_workflow_id
    );
    const failures = wfExecs.filter((e) => e.status === "error" || e.status === "crashed");
    const successRate =
      wfExecs.length > 0
        ? Math.round(((wfExecs.length - failures.length) / wfExecs.length) * 1000) / 10
        : 100;
    const durations = wfExecs.filter((e) => e.duration_ms != null).map((e) => e.duration_ms as number);
    const avgDuration =
      durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const sorted = [...wfExecs].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
    const latest = sorted[0];

    return {
      id: `${wf.instance_id}:${wf.n8n_workflow_id}`,
      instance_id: wf.instance_id,
      n8n_id: wf.n8n_workflow_id,
      name: wf.name,
      status: (wf.is_active ? "active" : "inactive") as Workflow["status"],
      tags: wf.tags ?? [],
      node_count: wf.node_count,
      last_execution_at: latest ? latest.started_at : null,
      last_execution_status: latest ? (latest.status as Workflow["last_execution_status"]) : null,
      executions_24h: wfExecs.length,
      failures_24h: failures.length,
      success_rate: successRate,
      avg_duration_ms: avgDuration,
      created_at: wf.created_at,
      updated_at: wf.updated_at,
    } as Workflow;
  });
}

async function fetchOrgStatsFromDB(orgId: string, instanceId?: string): Promise<DashboardStats | null> {
  const db = getServerDb();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let wfQuery = db.from("workflow_snapshots").select("id, is_active").eq("org_id", orgId);
  if (instanceId) wfQuery = wfQuery.eq("instance_id", instanceId);
  const { data: wfData } = await wfQuery;

  let exQuery = db
    .from("synced_executions")
    .select("status, started_at, duration_ms")
    .eq("org_id", orgId)
    .gte("started_at", since24h);
  if (instanceId) exQuery = exQuery.eq("instance_id", instanceId);
  const { data: exData } = await exQuery;

  if (!wfData || !exData) return null;
  if (wfData.length === 0 && exData.length === 0) return null;

  const failures = exData.filter((e) => e.status === "error" || e.status === "crashed");
  const durations = exData.filter((e) => e.duration_ms != null).map((e) => e.duration_ms as number);
  const avgDuration =
    durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const successRate =
    exData.length > 0
      ? Math.round(((exData.length - failures.length) / exData.length) * 1000) / 10
      : 100;

  const now = Date.now();
  const trend: TrendPoint[] = Array.from({ length: 24 }, (_, i) => {
    const hourStart = now - (24 - i) * 3600000;
    const hourEnd = hourStart + 3600000;
    const inHour = exData.filter((e) => {
      const t = new Date(e.started_at).getTime();
      return t >= hourStart && t < hourEnd;
    });
    return {
      time: new Date(hourStart).toISOString(),
      executions: inHour.length,
      failures: inHour.filter((e) => e.status === "error" || e.status === "crashed").length,
    };
  });

  return {
    total_workflows: wfData.length,
    active_workflows: wfData.filter((w) => w.is_active).length,
    executions_24h: exData.length,
    failures_24h: failures.length,
    success_rate: successRate,
    avg_duration_ms: avgDuration,
    open_incidents: 0,
    executions_trend: trend,
    failures_trend: trend,
  };
}

// ─── Live fallbacks ───────────────────────────────────────────────────────────

async function fetchOrgWorkflowsLive(orgId: string, instanceId?: string): Promise<Workflow[]> {
  const instances = await getOrgInstances(orgId, instanceId);
  const results: Workflow[] = [];
  await Promise.all(
    instances.map(async (inst) => {
      const client = makeClient(inst);
      if (!client) return;
      try {
        const [rawWorkflows, rawExecutions] = await Promise.all([
          client.getWorkflows(),
          client.getExecutions({ limit: 250 }),
        ]);
        const workflows = rawWorkflows.map((w) => toWorkflow(w, inst.id));
        results.push(...enrichWorkflowsWithStats(workflows, rawExecutions, inst.id));
      } catch { /* skip unreachable */ }
    })
  );
  return results;
}

async function fetchOrgExecutionsLive(orgId: string, instanceId?: string): Promise<Execution[]> {
  const instances = await getOrgInstances(orgId, instanceId);
  const results: Execution[] = [];
  await Promise.all(
    instances.map(async (inst) => {
      const client = makeClient(inst);
      if (!client) return;
      try {
        const [rawExecutions, rawWorkflows] = await Promise.all([
          client.getExecutions({ limit: 100 }),
          client.getWorkflows(),
        ]);
        const nameMap = Object.fromEntries(rawWorkflows.map((w) => [w.id, w.name]));
        for (const e of rawExecutions) {
          results.push(toExecution(e, inst.id, nameMap[e.workflowId] ?? "Unknown Workflow"));
        }
      } catch { /* skip unreachable */ }
    })
  );
  results.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  return results;
}

async function fetchOrgStatsLive(orgId: string, instanceId?: string): Promise<DashboardStats | null> {
  const instances = await getOrgInstances(orgId, instanceId);
  if (instances.length === 0) return null;
  const allWorkflows: import("@/lib/n8n").N8nWorkflowRaw[] = [];
  const allExecutions: import("@/lib/n8n").N8nExecutionRaw[] = [];
  await Promise.all(
    instances.map(async (inst) => {
      const client = makeClient(inst);
      if (!client) return;
      try {
        const [wfs, execs] = await Promise.all([
          client.getWorkflows(),
          client.getExecutions({ limit: 250 }),
        ]);
        allWorkflows.push(...wfs);
        allExecutions.push(...execs);
      } catch { /* skip */ }
    })
  );
  if (allWorkflows.length === 0 && allExecutions.length === 0) return null;
  return computeStats(allExecutions, allWorkflows);
}

// ─── Public helpers (DB-first, live fallback) ─────────────────────────────────

export async function fetchOrgWorkflows(orgId: string, instanceId?: string): Promise<Workflow[]> {
  const dbResults = await fetchOrgWorkflowsFromDB(orgId, instanceId);
  if (dbResults.length > 0) return dbResults;
  return fetchOrgWorkflowsLive(orgId, instanceId);
}

export async function fetchOrgExecutions(orgId: string, instanceId?: string): Promise<Execution[]> {
  const dbResults = await fetchOrgExecutionsFromDB(orgId, instanceId);
  if (dbResults.length > 0) return dbResults;
  return fetchOrgExecutionsLive(orgId, instanceId);
}

export async function fetchOrgStats(orgId: string, instanceId?: string): Promise<DashboardStats | null> {
  const dbStats = await fetchOrgStatsFromDB(orgId, instanceId);
  if (dbStats) return dbStats;
  return fetchOrgStatsLive(orgId, instanceId);
}

// ─── Detail fetchers (always live — need full node data) ──────────────────────

/** compositeId = "${instanceId}:${n8nWorkflowId}" */
export async function fetchWorkflowWithExecutions(
  orgId: string,
  compositeId: string
): Promise<{ workflow: Workflow; executions: Execution[] } | null> {
  const colonIdx = compositeId.indexOf(":");
  if (colonIdx === -1) return null;
  const instanceId = compositeId.slice(0, colonIdx);
  const n8nWorkflowId = compositeId.slice(colonIdx + 1);

  const db = getServerDb();
  const { data: inst } = await db
    .from("n8n_instances")
    .select("id, name, url, api_key_encrypted, last_synced_at")
    .eq("id", instanceId)
    .eq("org_id", orgId)
    .single();
  if (!inst) return null;

  const client = makeClient(inst as StoredInstance);
  if (!client) return null;

  try {
    const [rawWorkflow, rawExecutions] = await Promise.all([
      client.getWorkflowById(n8nWorkflowId),
      client.getExecutions({ limit: 100, workflowId: n8nWorkflowId }),
    ]);
    const allRawWorkflows = await client.getWorkflows().catch(() => [rawWorkflow]);
    const baseWorkflow = toWorkflow(rawWorkflow, instanceId);
    const [enriched] = enrichWorkflowsWithStats([baseWorkflow], rawExecutions, instanceId);
    const nameMap = Object.fromEntries(allRawWorkflows.map((w) => [w.id, w.name]));
    const executions = rawExecutions.map((e) =>
      toExecution(e, instanceId, nameMap[e.workflowId] ?? rawWorkflow.name)
    );
    executions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    return { workflow: enriched, executions };
  } catch {
    return null;
  }
}

/** compositeId = "${instanceId}:${n8nExecutionId}" */
export async function fetchExecutionWithData(
  orgId: string,
  compositeId: string
): Promise<Execution | null> {
  const colonIdx = compositeId.indexOf(":");
  if (colonIdx === -1) return null;
  const instanceId = compositeId.slice(0, colonIdx);
  const n8nExecutionId = compositeId.slice(colonIdx + 1);

  const db = getServerDb();
  const { data: inst } = await db
    .from("n8n_instances")
    .select("id, name, url, api_key_encrypted, last_synced_at")
    .eq("id", instanceId)
    .eq("org_id", orgId)
    .single();
  if (!inst) return null;

  const client = makeClient(inst as StoredInstance);
  if (!client) return null;

  try {
    const rawExec = await client.getExecutionWithData(n8nExecutionId);
    const rawWorkflows = await client.getWorkflows().catch(() => []);
    const nameMap = Object.fromEntries(rawWorkflows.map((w) => [w.id, w.name]));
    return toExecutionFull(rawExec, instanceId, nameMap[rawExec.workflowId] ?? "Unknown Workflow");
  } catch {
    return null;
  }
}
