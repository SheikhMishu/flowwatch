import { getSession } from "@/lib/auth";
import {
  fetchOrgStats,
  fetchOrgExecutions,
  fetchOrgDailyAggregates,
  fetchWorkflowPerformanceStats,
  fetchErrorMessageBreakdown,
} from "@/lib/n8n-data";
import { mockStats, mockExecutions } from "@/lib/mock-data";
import { Header } from "@/components/layout/header";
import { AnalyticsClient } from "./analytics-client";
import type { Execution, DashboardStats } from "@/types";
import type { DailyExecutionAggregate, WorkflowPerformanceStat, ErrorMessageStat } from "@/lib/n8n-data";

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
  let dailyAggregates: DailyExecutionAggregate[] = [];
  let workflowStats: WorkflowPerformanceStat[] = [];
  let errorBreakdown: ErrorMessageStat[] = [];

  if (isDemo) {
    stats = mockStats;
    executions = mockExecutions;
  } else {
    try {
      const since14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      [stats, executions, dailyAggregates, workflowStats, errorBreakdown] = await Promise.all([
        fetchOrgStats(session!.orgId, instanceId).catch(() => null),
        fetchOrgExecutions(session!.orgId, instanceId, since14d).catch(() => []),
        fetchOrgDailyAggregates(session!.orgId, instanceId, 14).catch(() => []),
        fetchWorkflowPerformanceStats(session!.orgId, instanceId, 7).catch(() => []),
        fetchErrorMessageBreakdown(session!.orgId, instanceId, 7).catch(() => []),
      ]);
    } catch {
      // Fall back gracefully — client will show empty state
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Analytics" />
      <div className="flex-1 p-4 md:p-6 animate-fade-in">
        <AnalyticsClient
          executions={executions}
          stats={stats}
          isDemo={isDemo}
          dailyAggregates={dailyAggregates}
          workflowStats={workflowStats}
          errorBreakdown={errorBreakdown}
        />
      </div>
    </div>
  );
}
