/**
 * Plan definitions and limit helpers.
 * Single source of truth — used by API routes, billing page, and enforcement checks.
 */

export type PlanId = "free" | "pro" | "team";

export interface PlanLimits {
  instances: number;
  retentionDays: number;
  members: number | null;          // null = unlimited
  alertRules: number | null;       // null = unlimited
  aiDebug: boolean;
  slackAlerts: boolean;
  aiRequestsPerMonth: number | null; // null = no Anthropic usage (free uses OpenRouter)
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    instances: 1,
    retentionDays: 7,
    members: 2,
    alertRules: 2,
    aiDebug: false,
    slackAlerts: false,
    aiRequestsPerMonth: null,
  },
  pro: {
    instances: 5,
    retentionDays: 30,
    members: 10,
    alertRules: 20,
    aiDebug: true,
    slackAlerts: true,
    aiRequestsPerMonth: 100,
  },
  team: {
    instances: 10,
    retentionDays: 90,
    members: null,
    alertRules: null,
    aiDebug: true,
    slackAlerts: true,
    aiRequestsPerMonth: 500,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[(plan as PlanId)] ?? PLAN_LIMITS.free;
}
