/**
 * Plan definitions and limit helpers.
 * Single source of truth — used by API routes, billing page, and enforcement checks.
 */

export type PlanId = "free" | "pro" | "team";

export interface PlanLimits {
  instances: number;
  retentionDays: number;
  members: number | null; // null = unlimited
  aiDebug: boolean;
  slackAlerts: boolean;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    instances: 1,
    retentionDays: 7,
    members: 2,
    aiDebug: false,
    slackAlerts: false,
  },
  pro: {
    instances: 5,
    retentionDays: 30,
    members: 10,
    aiDebug: true,
    slackAlerts: true,
  },
  team: {
    instances: 10,
    retentionDays: 90,
    members: null,
    aiDebug: true,
    slackAlerts: true,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[(plan as PlanId)] ?? PLAN_LIMITS.free;
}
