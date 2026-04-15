// Alert evaluation engine
// Called after every sync run. For each active alert:
//   1. Count failures in synced_executions within the threshold window
//   2. If count >= threshold and cooldown has elapsed → fire + record

import { getServerDb } from "@/lib/db";
import { sendAlertEmail } from "@/lib/email";

interface AlertRow {
  id: string;
  org_id: string;
  instance_id: string | null;
  workflow_id: string | null;
  name: string;
  channel: "email" | "slack" | "webhook";
  destination: string;
  threshold_count: number;
  threshold_minutes: number;
  cooldown_minutes: number;
  last_fired_at: string | null;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function evaluateOrgAlerts(orgId: string): Promise<void> {
  const db = getServerDb();

  const { data: alerts } = await db
    .from("alerts")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_active", true);

  if (!alerts || alerts.length === 0) return;

  const now = new Date();

  for (const alert of alerts as AlertRow[]) {
    // Enforce cooldown
    if (alert.last_fired_at) {
      const elapsed = now.getTime() - new Date(alert.last_fired_at).getTime();
      if (elapsed < alert.cooldown_minutes * 60 * 1000) continue;
    }

    // Count failures in the threshold window
    const windowStart = new Date(now.getTime() - alert.threshold_minutes * 60 * 1000).toISOString();

    let query = db
      .from("synced_executions")
      .select("workflow_name, n8n_workflow_id, instance_id")
      .eq("org_id", orgId)
      .eq("status", "error")
      .gte("started_at", windowStart);

    if (alert.instance_id) query = query.eq("instance_id", alert.instance_id);
    if (alert.workflow_id) query = query.eq("n8n_workflow_id", alert.workflow_id);

    const { data: failures } = await query;
    if (!failures || failures.length < alert.threshold_count) continue;

    // Fire
    const workflowNames = [...new Set(failures.map((f) => f.workflow_name))];
    await fireAlert(alert, failures.length, workflowNames);

    // Record firing and update last_fired_at
    const firedAt = new Date().toISOString();
    await Promise.all([
      db.from("alerts").update({ last_fired_at: firedAt }).eq("id", alert.id),
      db.from("alert_firings").insert({
        alert_id: alert.id,
        org_id: orgId,
        fired_at: firedAt,
        failure_count: failures.length,
        workflow_names: workflowNames,
      }),
      upsertIncident(db, alert, orgId, failures),
    ]);
  }
}

// ─── Incident upsert ──────────────────────────────────────────────────────────

type FailureRow = { workflow_name: string; n8n_workflow_id: string; instance_id: string };

async function upsertIncident(
  db: ReturnType<typeof getServerDb>,
  alert: AlertRow,
  orgId: string,
  failures: FailureRow[],
): Promise<void> {
  const workflowName = failures[0]?.workflow_name ?? "Unknown workflow";
  const n8nWorkflowId = alert.workflow_id ?? failures[0]?.n8n_workflow_id ?? null;
  const instanceId = alert.instance_id ?? failures[0]?.instance_id ?? null;
  const failureCount = failures.length;
  const severity = failureCount >= 10 ? "critical" : failureCount >= 5 ? "high" : failureCount >= 2 ? "medium" : "low";
  const title = `${alert.name}: ${failureCount} failure${failureCount !== 1 ? "s" : ""} detected`;
  const now = new Date().toISOString();

  // Look for an existing open/investigating incident for the same alert
  const { data: existing } = await db
    .from("incidents")
    .select("id, failure_count")
    .eq("org_id", orgId)
    .eq("alert_id", alert.id)
    .in("status", ["open", "investigating"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await db.from("incidents").update({
      failure_count: existing.failure_count + failureCount,
      last_seen_at: now,
      severity,
      title,
    }).eq("id", existing.id);
  } else {
    await db.from("incidents").insert({
      org_id: orgId,
      instance_id: instanceId,
      alert_id: alert.id,
      n8n_workflow_id: n8nWorkflowId,
      workflow_name: workflowName,
      severity,
      status: "open",
      title,
      failure_count: failureCount,
      first_seen_at: now,
      last_seen_at: now,
    });
  }
}

// ─── Delivery ─────────────────────────────────────────────────────────────────

async function fireAlert(alert: AlertRow, failureCount: number, workflowNames: string[]): Promise<void> {
  const subject = `FlowMonix Alert: ${alert.name} — ${failureCount} failure${failureCount !== 1 ? "s" : ""} in ${alert.threshold_minutes}min`;

  if (alert.channel === "email") {
    await sendAlertEmail(alert.destination, subject, buildEmailHtml(alert, failureCount, workflowNames));
    return;
  }

  if (alert.channel === "slack") {
    await fetch(alert.destination, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSlackPayload(alert, failureCount, workflowNames)),
    }).catch((err) => console.error(`[alert-engine] slack delivery failed for ${alert.id}:`, err.message));
    return;
  }

  // Generic webhook
  await fetch(alert.destination, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      alert: { id: alert.id, name: alert.name },
      failures: { count: failureCount, workflows: workflowNames },
      threshold: { count: alert.threshold_count, minutes: alert.threshold_minutes },
      fired_at: new Date().toISOString(),
    }),
  }).catch((err) => console.error(`[alert-engine] webhook delivery failed for ${alert.id}:`, err.message));
}

// ─── Payload builders ─────────────────────────────────────────────────────────

function buildEmailHtml(alert: AlertRow, count: number, workflows: string[]): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const wfItems = workflows
    .map((n) => `<li style="padding:3px 0;color:#374151;">${n}</li>`)
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:24px;margin-bottom:24px;">
        <h2 style="color:#fff;margin:0 0 6px;font-size:20px;">Alert triggered</h2>
        <p style="color:rgba(255,255,255,0.85);margin:0;font-size:16px;font-weight:600;">${alert.name}</p>
      </div>

      <p style="color:#374151;font-size:15px;margin:0 0 20px;line-height:1.5;">
        <strong>${count} failure${count !== 1 ? "s" : ""}</strong> detected in the last
        <strong>${alert.threshold_minutes} minute${alert.threshold_minutes !== 1 ? "s" : ""}</strong>
        — exceeding your threshold of ${alert.threshold_count}.
      </p>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="color:#991b1b;font-weight:600;margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">
          Affected workflows
        </p>
        <ul style="margin:0;padding-left:18px;font-size:14px;">${wfItems}</ul>
      </div>

      <a href="${appUrl}/dashboard"
         style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
        Open dashboard
      </a>

      <p style="color:#9ca3af;font-size:12px;margin-top:28px;line-height:1.5;">
        Cooldown is set to ${alert.cooldown_minutes} minute${alert.cooldown_minutes !== 1 ? "s" : ""}.
        You won't receive another notification for this alert until the cooldown expires.<br/>
        To manage your alerts, visit <a href="${appUrl}/dashboard/alerts" style="color:#6366f1;">FlowMonix</a>.
      </p>
    </div>
  `;
}

function buildSlackPayload(alert: AlertRow, count: number, workflows: string[]): object {
  const wfText = workflows.map((n) => `• ${n}`).join("\n");
  return {
    text: `🚨 FlowMonix Alert: ${alert.name} — ${count} failure${count !== 1 ? "s" : ""}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `🚨 ${alert.name}`, emoji: true },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${count} failure${count !== 1 ? "s" : ""}* in the last *${alert.threshold_minutes} min* (threshold: ${alert.threshold_count})`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Affected workflows:*\n${wfText}`,
        },
      },
    ],
  };
}
