import Link from "next/link";
import { Server, Activity } from "lucide-react";
import { getSession } from "@/lib/auth";
import { fetchOrgWorkflows } from "@/lib/n8n-data";
import { getServerDb } from "@/lib/db";
import { mockWorkflows } from "@/lib/mock-data";
import { Header } from "@/components/layout/header";
import { WorkflowsClient } from "./workflows-client";

export default async function WorkflowsPage({
  searchParams,
}: {
  searchParams: Promise<{ instance?: string }>;
}) {
  const { instance: instanceId } = await searchParams;
  const session = await getSession();
  const isDemo = !session || session.orgId === "org_demo";

  // Check for instances
  let hasInstances = isDemo;
  if (!isDemo) {
    const db = getServerDb();
    const { data } = await db
      .from("n8n_instances")
      .select("id")
      .eq("org_id", session!.orgId)
      .eq("is_active", true)
      .limit(1);
    hasInstances = (data?.length ?? 0) > 0;
  }

  let workflows = isDemo ? mockWorkflows : [];
  if (!isDemo && hasInstances) {
    const real = await fetchOrgWorkflows(session!.orgId, instanceId).catch(() => null);
    if (real && real.length > 0) workflows = real;
  }

  const total = workflows.length;
  const active = workflows.filter((w) => w.status === "active").length;
  const inactive = total - active;

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Workflows" />
      <div className="flex-1 p-4 md:p-6 space-y-5 animate-fade-in">
        {/* Summary bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm shadow-card">
            <span className="font-semibold text-foreground">{total}</span>
            <span className="text-muted-foreground">Total</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-success/20 bg-success/10 px-4 py-1.5 text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="font-semibold text-success">{active}</span>
            <span className="text-success/70">Active</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            <span className="font-semibold text-muted-foreground">{inactive}</span>
            <span className="text-muted-foreground">Inactive</span>
          </div>
        </div>

        {!isDemo && !hasInstances ? (
          <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center">
              <Server className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">No instances connected yet</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Connect an n8n instance to see your workflows here.
              </p>
            </div>
            <Link
              href="/dashboard/instances"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <Server className="w-4 h-4" />
              Connect Instance
            </Link>
          </div>
        ) : workflows.length === 0 && !isDemo ? (
          <div className="rounded-xl border border-border bg-card shadow-card p-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Activity className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">No workflows found</p>
              <p className="text-sm text-muted-foreground mt-1">Your n8n instance returned no workflows.</p>
            </div>
          </div>
        ) : (
          <WorkflowsClient workflows={workflows} />
        )}
      </div>
    </div>
  );
}
