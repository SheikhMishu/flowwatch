/**
 * User activity / audit logging.
 *
 * Always fire-and-forget — never awaited, never throws, never blocks a response.
 * Writes to activity_logs table in Supabase.
 *
 * Usage:
 *   import { logActivity } from "@/lib/activity";
 *   logActivity(session, "instance.created", { resourceType: "instance", resourceId: id, metadata: { name } });
 */

import { getServerDb } from "@/lib/db";
import type { SessionPayload } from "@/lib/auth";

// ─── Action catalogue ─────────────────────────────────────────────────────────

export type ActivityAction =
  // Auth
  | "auth.login"
  | "auth.logout"
  | "auth.pin_failed"
  | "auth.org_created"
  | "auth.invite_accepted"
  // Instances
  | "instance.created"
  | "instance.deleted"
  | "instance.updated"
  | "instance.tested"
  | "instance.synced"
  // Incidents
  | "incident.status_changed"
  // Alerts
  | "alert.created"
  | "alert.updated"
  | "alert.deleted"
  // AI
  | "ai.explain_requested"
  // Team
  | "team.member_invited"
  | "team.member_removed"
  | "team.role_changed"
  // Profile
  | "profile.updated"
  // Org settings
  | "org.status_page_updated"
  // Billing
  | "billing.checkout_started"
  | "billing.plan_upgraded"
  | "billing.plan_canceled";

export interface ActivityOptions {
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

// ─── Minimal session shape accepted ──────────────────────────────────────────
// Accepts a full SessionPayload or a minimal object (e.g. during auth flows
// before a full session exists)

type ActivitySession =
  | SessionPayload
  | { orgId: string; userId?: string; email?: string; name?: string };

// ─── Public function ──────────────────────────────────────────────────────────

export function logActivity(
  session: ActivitySession,
  action: ActivityAction,
  options: ActivityOptions = {},
): void {
  // Intentionally fire-and-forget
  try {
    const db = getServerDb();
    const insert = db.from("activity_logs")
      .insert({
        org_id: session.orgId,
        user_id: "userId" in session ? (session.userId ?? null) : null,
        user_email: "email" in session ? (session.email ?? null) : null,
        user_name: "name" in session ? (session.name ?? null) : null,
        action,
        resource_type: options.resourceType ?? null,
        resource_id: options.resourceId ?? null,
        metadata: options.metadata ?? null,
        ip: options.ip ?? null,
      });
    Promise.resolve(insert).then(() => {}).catch(() => {}); // Silently swallow — audit log failure must never crash the app
  } catch {
    // Swallow construction errors too
  }
}
