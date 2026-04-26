import { getSession } from "@/lib/auth";
import { fetchOrgExecutions } from "@/lib/n8n-data";
import { mockExecutions } from "@/lib/mock-data";
import { Header } from "@/components/layout/header";
import { formatDuration } from "@/lib/utils";
import { ExecutionsClient } from "./executions-client";

export default async function ExecutionsPage({
  searchParams,
}: {
  searchParams: Promise<{ instance?: string }>;
}) {
  const { instance: instanceId } = await searchParams;
  const session = await getSession();

  const isDemo = !session || session.orgId === "org_demo";
  let executions = isDemo ? mockExecutions : [];
  if (!isDemo) {
    const real = await fetchOrgExecutions(session!.orgId, instanceId).catch(() => null);
    if (real !== null) executions = real;
  }

  const total = executions.length;
  const successCount = executions.filter((e) => e.status === "success").length;
  const errorCount = executions.filter((e) => e.status === "error").length;

  const durationsMs = executions
    .filter((e) => e.duration_ms !== null)
    .map((e) => e.duration_ms as number);
  const avgDuration =
    durationsMs.length > 0
      ? Math.round(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length)
      : 0;

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Executions" />
      <div className="flex-1 p-4 md:p-6 space-y-5 animate-fade-in">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card shadow-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{total}</p>
          </div>
          <div className="rounded-xl border border-success/20 bg-success/5 shadow-card p-4">
            <p className="text-xs font-medium text-success/70 uppercase tracking-wide mb-1">Success</p>
            <p className="text-2xl font-bold text-success tabular-nums">{successCount}</p>
          </div>
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 shadow-card p-4">
            <p className="text-xs font-medium text-destructive/70 uppercase tracking-wide mb-1">Errors</p>
            <p className="text-2xl font-bold text-destructive tabular-nums">{errorCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card shadow-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Avg Duration</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{formatDuration(avgDuration)}</p>
          </div>
        </div>

        <ExecutionsClient executions={executions} />
      </div>
    </div>
  );
}
