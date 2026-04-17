import { getServerDb } from "@/lib/db";
import { getPlanLimits } from "@/lib/plans";
import { logger } from "@/lib/logger";

export interface RetentionResult {
  orgId: string;
  plan: string;
  retentionDays: number;
  deleted: number;
  ok: boolean;
  error?: string;
}

export async function runRetention(): Promise<RetentionResult[]> {
  const db = getServerDb();

  // Fetch all orgs with their current plan
  const { data: orgs, error: orgsError } = await db
    .from("organizations")
    .select("id, plan");

  if (orgsError || !orgs) {
    throw new Error(orgsError?.message ?? "Failed to fetch organizations");
  }

  const results: RetentionResult[] = [];

  for (const org of orgs) {
    const plan = org.plan ?? "free";
    const { retentionDays } = getPlanLimits(plan);
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

    try {
      // Delete synced_executions older than the cutoff for this org's instances
      const { error, count } = await db
        .from("synced_executions")
        .delete({ count: "exact" })
        .eq("org_id", org.id)
        .lt("started_at", cutoff);

      if (error) throw new Error(error.message);

      results.push({
        orgId: org.id,
        plan,
        retentionDays,
        deleted: count ?? 0,
        ok: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("Retention: failed for org", {
        category: "retention",
        orgId: org.id,
        err: err instanceof Error ? err : new Error(message),
      });
      results.push({
        orgId: org.id,
        plan,
        retentionDays,
        deleted: 0,
        ok: false,
        error: message,
      });
    }
  }

  return results;
}
