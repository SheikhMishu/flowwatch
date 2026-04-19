// Alert evaluation engine
// Called after every sync run. For each active alert:
//   1. Count failures in synced_executions within the threshold window
//   2. If count >= threshold and cooldown has elapsed → fire + record

import { getServerDb } from "@/lib/db";
import { sendAlertEmail, emailLayout, ctaButton } from "@/lib/email";
import { logger } from "@/lib/logger";

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
  snoozed_until: string | null;
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
    try {
      // Skip if snoozed
      if (alert.snoozed_until && new Date(alert.snoozed_until) > now) continue;

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
      logger.info("Alert fired", { category: "alert-engine", orgId, alertId: alert.id, alertName: alert.name, failureCount: failures.length, workflowNames });
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
    } catch (err) {
      // Catch per-alert so one bad alert never blocks the rest from being evaluated
      logger.error("Alert evaluation failed for alert", {
        category: "alert-engine",
        orgId,
        alertId: alert.id,
        alertName: alert.name,
        channel: alert.channel,
        err,
      });
    }
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
    const { error } = await db.from("incidents").update({
      failure_count: existing.failure_count + failureCount,
      last_seen_at: now,
      severity,
      title,
    }).eq("id", existing.id);
    if (error) {
      logger.error("upsertIncident: failed to update existing incident", {
        category: "alert-engine",
        orgId,
        alertId: alert.id,
        incidentId: existing.id,
        err: error,
      });
    }
  } else {
    const { error } = await db.from("incidents").insert({
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
    if (error) {
      logger.error("upsertIncident: failed to create new incident", {
        category: "alert-engine",
        orgId,
        alertId: alert.id,
        workflowName,
        err: error,
      });
    }
  }
}

// ─── Delivery ─────────────────────────────────────────────────────────────────

async function fireAlert(alert: AlertRow, failureCount: number, workflowNames: string[]): Promise<void> {
  const failWord = failureCount !== 1 ? "failures" : "failure";
  const subject = `[FlowMonix] ${alert.name}: ${failureCount} ${failWord} in ${alert.threshold_minutes}min`;

  if (alert.channel === "email") {
    try {
      await sendAlertEmail(alert.destination, subject, buildEmailHtml(alert, failureCount, workflowNames));
    } catch (err) {
      logger.error("Email alert delivery failed", {
        category: "alert-engine",
        alertId: alert.id,
        destination: alert.destination,
        err,
      });
      throw err;
    }
    return;
  }

  if (alert.channel === "slack") {
    await fetch(alert.destination, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSlackPayload(alert, failureCount, workflowNames)),
    }).catch((err) => logger.warn("Slack delivery failed", { category: "alert-engine", alertId: alert.id, err }));
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
  }).catch((err) => logger.warn("Webhook delivery failed", { category: "alert-engine", alertId: alert.id, err }));
}

// ─── Payload builders ─────────────────────────────────────────────────────────

function buildEmailHtml(alert: AlertRow, count: number, workflows: string[]): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.flowmonix.com";
  const failureWord = count !== 1 ? "failures" : "failure";
  const minuteWord = alert.threshold_minutes !== 1 ? "minutes" : "minute";
  const cooldownWord = alert.cooldown_minutes !== 1 ? "minutes" : "minute";

  const wfRows = workflows
    .map(
      (n) =>
        `<tr><td style="padding:7px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ef4444;margin-right:10px;vertical-align:middle;"></span>
          ${n}
        </td></tr>`
    )
    .join("");

  const severity = count >= 10 ? "critical" : count >= 5 ? "high" : "elevated";
  const severityColor = count >= 10 ? "#dc2626" : count >= 5 ? "#d97706" : "#6366f1";
  const severityBg = count >= 10 ? "#fef2f2" : count >= 5 ? "#fffbeb" : "#eef2ff";
  const severityBorder = count >= 10 ? "#fecaca" : count >= 5 ? "#fde68a" : "#c7d2fe";

  const content = `
    <!-- Alert name + severity badge -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td>
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">
            Alert triggered
          </p>
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.3px;line-height:1.3;">
            ${alert.name}
          </h1>
        </td>
        <td align="right" valign="top" style="padding-top:4px;">
          <span style="display:inline-block;background:${severityBg};border:1px solid ${severityBorder};color:${severityColor};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:4px 10px;border-radius:20px;">
            ${severity}
          </span>
        </td>
      </tr>
    </table>

    <!-- Stats row -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:24px;">
      <tr>
        <td width="50%" style="padding:16px 20px;border-right:1px solid #e5e7eb;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Failures detected</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#ef4444;">${count}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#9ca3af;">in last ${alert.threshold_minutes} ${minuteWord}</p>
        </td>
        <td width="50%" style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Threshold</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#374151;">${alert.threshold_count}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#9ca3af;">${failureWord} to trigger</p>
        </td>
      </tr>
    </table>

    <!-- Affected workflows -->
    <p style="margin:0 0 10px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">
      Affected workflows
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
           style="border:1px solid #fecaca;border-radius:10px;overflow:hidden;background:#fff;">
      <tbody>
        ${wfRows}
      </tbody>
    </table>

    ${ctaButton("View incidents", `${appUrl}/dashboard/incidents`)}

    <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;line-height:1.6;">
      Next notification for this alert: after the ${alert.cooldown_minutes}-${cooldownWord} cooldown expires.
      <a href="${appUrl}/dashboard/alerts" style="color:#6366f1;text-decoration:none;">Manage alerts</a>
    </p>
  `;

  return emailLayout(content, "You received this because you have an active alert rule configured in FlowMonix.");
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
