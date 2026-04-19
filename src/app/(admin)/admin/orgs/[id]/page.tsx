import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { OrgDetailClient } from "./org-detail-client";

export const dynamic = "force-dynamic";

export default async function AdminOrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();
  if (!session) redirect("/login");

  const db = getServerDb();
  const { data: adminUser } = await db
    .from("users")
    .select("is_super_admin")
    .eq("id", session.userId)
    .single();

  if (!adminUser?.is_super_admin) redirect("/dashboard");

  const { data: org } = await db
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();

  if (!org) redirect("/admin/orgs");

  const [
    { data: members },
    { data: instances },
    { count: workflowCount },
    { count: executionCount },
    { count: alertCount },
    { count: incidentCount },
    { count: openIncidents },
    { data: aiUsage },
    { count: alertFirings },
  ] = await Promise.all([
    db
      .from("organization_members")
      .select("id, role, created_at, users(id, email, name)")
      .eq("org_id", id),
    db
      .from("n8n_instances")
      .select("*")
      .eq("org_id", id)
      .order("created_at"),
    db
      .from("workflow_snapshots")
      .select("id", { count: "exact", head: true })
      .eq("org_id", id),
    db
      .from("synced_executions")
      .select("id", { count: "exact", head: true })
      .eq("org_id", id),
    db
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("org_id", id)
      .eq("is_active", true),
    db
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("org_id", id),
    db
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("org_id", id)
      .eq("status", "open"),
    db
      .from("ai_usage")
      .select("month, count")
      .eq("org_id", id)
      .order("month", { ascending: false })
      .limit(6),
    db
      .from("alert_firings")
      .select("id", { count: "exact", head: true })
      .eq("org_id", id)
      .gte(
        "fired_at",
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      ),
  ]);

  const aiTotal = (aiUsage ?? []).reduce((s, r) => s + r.count, 0);
  const aiThisMonth = aiUsage?.[0]?.count ?? 0;

  return (
    <OrgDetailClient
      org={org}
      members={(members ?? []) as unknown as Parameters<typeof OrgDetailClient>[0]["members"]}
      instances={instances ?? []}
      workflowCount={workflowCount ?? 0}
      executionCount={executionCount ?? 0}
      alertCount={alertCount ?? 0}
      incidentCount={incidentCount ?? 0}
      openIncidents={openIncidents ?? 0}
      aiUsage={(aiUsage ?? []).slice().reverse()}
      aiTotal={aiTotal}
      aiThisMonth={aiThisMonth}
      alertFirings={alertFirings ?? 0}
    />
  );
}
