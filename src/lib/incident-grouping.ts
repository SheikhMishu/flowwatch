// Incident grouping: runs after every sync.
// Groups failed executions by (workflow + error_signature) within a 15-min window.
// Stale open incidents (no new failures for 30 min) are auto-resolved.

import { getServerDb } from "@/lib/db";
import { generateErrorSignature } from "@/lib/error-signature";

type Db = ReturnType<typeof getServerDb>;

interface ErrorExecution {
  id: string;
  org_id: string;
  instance_id: string;
  n8n_execution_id: string;
  n8n_workflow_id: string;
  workflow_name: string;
  failed_node: string | null;
  error_message: string | null;
}

function calcSeverity(count: number): string {
  if (count >= 10) return "critical";
  if (count >= 5)  return "high";
  if (count >= 2)  return "medium";
  return "low";
}

// ─── Public entry points ──────────────────────────────────────────────────────

/**
 * For every error execution that hasn't been assigned to an incident yet,
 * find or create a matching incident and link them.
 */
export async function processErrorExecutions(
  db: Db,
  orgId: string,
  instanceId: string,
): Promise<void> {
  const { data: errors } = await db
    .from("synced_executions")
    .select("id, org_id, instance_id, n8n_execution_id, n8n_workflow_id, workflow_name, failed_node, error_message")
    .eq("org_id", orgId)
    .eq("instance_id", instanceId)
    .eq("status", "error")
    .is("incident_id", null);

  if (!errors || errors.length === 0) return;

  for (const exec of errors as ErrorExecution[]) {
    await findOrCreateIncident(db, exec).catch((err) =>
      console.error(`[incident-grouping] failed for exec ${exec.id}:`, err.message)
    );
  }
}

/**
 * Mark open incidents as resolved when no new failures have arrived in 30 min.
 */
export async function autoResolveIncidents(db: Db, orgId: string): Promise<void> {
  const threshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  await db
    .from("incidents")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("status", "open")
    .lt("last_seen_at", threshold);
}

// ─── Core logic ───────────────────────────────────────────────────────────────

async function findOrCreateIncident(db: Db, exec: ErrorExecution): Promise<void> {
  const sig = generateErrorSignature(exec.n8n_workflow_id, exec.failed_node, exec.error_message);
  const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  // Look for an open incident with the same signature within the 15-min window
  const { data: existing } = await db
    .from("incidents")
    .select("id, failure_count")
    .eq("org_id", exec.org_id)
    .eq("error_signature", sig)
    .eq("status", "open")
    .gte("last_seen_at", windowStart)
    .order("last_seen_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let incidentId: string;

  if (existing) {
    const newCount = existing.failure_count + 1;
    incidentId = existing.id;
    await db
      .from("incidents")
      .update({
        failure_count: newCount,
        last_seen_at: now,
        severity: calcSeverity(newCount),
        last_n8n_execution_id: exec.n8n_execution_id,
      })
      .eq("id", incidentId);
  } else {
    const title = `${exec.workflow_name}: ${exec.failed_node ?? "workflow"} failing`;
    const { data: created } = await db
      .from("incidents")
      .insert({
        org_id: exec.org_id,
        instance_id: exec.instance_id,
        n8n_workflow_id: exec.n8n_workflow_id,
        workflow_name: exec.workflow_name,
        error_signature: sig,
        node_name: exec.failed_node,
        error_message: exec.error_message,
        severity: "low",
        status: "open",
        title,
        failure_count: 1,
        first_seen_at: now,
        last_seen_at: now,
        last_n8n_execution_id: exec.n8n_execution_id,
      })
      .select("id")
      .single();

    if (!created) return;
    incidentId = created.id;
  }

  // Link the execution to its incident
  await db
    .from("synced_executions")
    .update({ error_signature: sig, incident_id: incidentId })
    .eq("id", exec.id);
}
