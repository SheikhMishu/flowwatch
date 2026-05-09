import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";

export interface WorkspaceHealth {
  id: string;
  name: string;
  slug: string;
  instanceCount: number;
  memberCount: number;
  openIncidents: number;
  lastSyncedAt: string | null;
  status: "healthy" | "degraded" | "no_instances";
}

export async function GET() {
  const session = await getSession();
  if (!session || session.orgId === "org_demo") {
    return NextResponse.json({ workspaces: [] });
  }

  const db = getServerDb();

  // Only owners can manage child workspaces
  const { data: membership } = await db
    .from("organization_members")
    .select("role")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .single();

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ workspaces: [] });
  }

  // Fetch all child workspaces
  const { data: children } = await db
    .from("organizations")
    .select("id, name, slug")
    .eq("parent_org_id", session.orgId)
    .order("created_at", { ascending: true });

  if (!children || children.length === 0) {
    return NextResponse.json({ workspaces: [] });
  }

  const childIds = children.map((c) => c.id);

  // Fetch health data for all child workspaces in parallel
  const [instanceRows, incidentRows, memberRows] = await Promise.all([
    db
      .from("n8n_instances")
      .select("org_id, last_synced_at")
      .in("org_id", childIds)
      .eq("is_active", true),
    db
      .from("incidents")
      .select("org_id")
      .in("org_id", childIds)
      .in("status", ["open", "investigating"]),
    db
      .from("organization_members")
      .select("org_id")
      .in("org_id", childIds),
  ]);

  // Aggregate per org
  const instancesByOrg = new Map<string, { count: number; lastSync: string | null }>();
  for (const row of instanceRows.data ?? []) {
    const existing = instancesByOrg.get(row.org_id) ?? { count: 0, lastSync: null };
    existing.count += 1;
    if (row.last_synced_at) {
      if (!existing.lastSync || row.last_synced_at > existing.lastSync) {
        existing.lastSync = row.last_synced_at;
      }
    }
    instancesByOrg.set(row.org_id, existing);
  }

  const incidentsByOrg = new Map<string, number>();
  for (const row of incidentRows.data ?? []) {
    incidentsByOrg.set(row.org_id, (incidentsByOrg.get(row.org_id) ?? 0) + 1);
  }

  const membersByOrg = new Map<string, number>();
  for (const row of memberRows.data ?? []) {
    membersByOrg.set(row.org_id, (membersByOrg.get(row.org_id) ?? 0) + 1);
  }

  const workspaces: WorkspaceHealth[] = children.map((child) => {
    const instances = instancesByOrg.get(child.id) ?? { count: 0, lastSync: null };
    const openIncidents = incidentsByOrg.get(child.id) ?? 0;
    const memberCount = membersByOrg.get(child.id) ?? 0;

    let status: WorkspaceHealth["status"] = "healthy";
    if (instances.count === 0) {
      status = "no_instances";
    } else if (openIncidents > 0) {
      status = "degraded";
    }

    return {
      id: child.id,
      name: child.name,
      slug: child.slug,
      instanceCount: instances.count,
      memberCount,
      openIncidents,
      lastSyncedAt: instances.lastSync,
      status,
    };
  });

  return NextResponse.json({ workspaces });
}
