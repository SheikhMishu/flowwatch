import { getSession } from "@/lib/auth";
import { fetchOrgStats, fetchOrgExecutions } from "@/lib/n8n-data";
import { mockStats, mockExecutions } from "@/lib/mock-data";
import { Header } from "@/components/layout/header";
import { AnalyticsClient } from "./analytics-client";
import type { Execution, DashboardStats } from "@/types";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ instance?: string }>;
}) {
  const { instance: instanceId } = await searchParams;
  const session = await getSession();
  const isDemo = !session || session.orgId === "org_demo";

  let stats: DashboardStats | null = null;
  let executions: Execution[] = [];

  if (isDemo) {
    stats = mockStats;
    executions = mockExecutions;
  } else {
    try {
      [stats, executions] = await Promise.all([
        fetchOrgStats(session!.orgId, instanceId).catch(() => null),
        fetchOrgExecutions(session!.orgId, instanceId).catch(() => []),
      ]);
    } catch {
      // Fall back gracefully — client will show empty state
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Analytics" />
      <div className="flex-1 p-4 md:p-6 animate-fade-in">
        <AnalyticsClient executions={executions} stats={stats} isDemo={isDemo} />
      </div>
    </div>
  );
}
