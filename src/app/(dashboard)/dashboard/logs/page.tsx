import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { LogsClient } from "./logs-client";
import type { ActivityLog } from "@/app/api/logs/activity/route";
import type { AppLog } from "@/app/api/logs/system/route";

export const dynamic = "force-dynamic";

async function fetchActivityLogs(orgId: string): Promise<{ logs: ActivityLog[]; total: number }> {
  const db = getServerDb();
  const { data, count } = await db
    .from("activity_logs")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .range(0, 49);
  return { logs: (data ?? []) as ActivityLog[], total: count ?? 0 };
}

async function fetchSystemLogs(orgId: string): Promise<{ logs: AppLog[]; total: number }> {
  const db = getServerDb();
  const { data, count } = await db
    .from("app_logs")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .range(0, 49);
  return { logs: (data ?? []) as AppLog[], total: count ?? 0 };
}

export default async function LogsPage() {
  const session = await getSession();

  if (!session) redirect("/login");
  if (session.role === "viewer") redirect("/dashboard");

  const isDemo = session.orgId === "org_demo";

  const [activityResult, systemResult] = isDemo
    ? [
        { logs: [] as ActivityLog[], total: 0 },
        { logs: [] as AppLog[], total: 0 },
      ]
    : await Promise.all([
        fetchActivityLogs(session.orgId).catch(() => ({ logs: [] as ActivityLog[], total: 0 })),
        fetchSystemLogs(session.orgId).catch(() => ({ logs: [] as AppLog[], total: 0 })),
      ]);

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Logs" />
      <LogsClient
        initialActivityLogs={activityResult.logs}
        initialActivityTotal={activityResult.total}
        initialSystemLogs={systemResult.logs}
        initialSystemTotal={systemResult.total}
      />
    </div>
  );
}
