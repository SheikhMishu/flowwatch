import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.orgId === "org_demo") {
    return NextResponse.json({ orgs: [] });
  }

  const db = getServerDb();

  // Direct memberships
  const { data: memberships } = await db
    .from("organization_members")
    .select("role, created_at, organizations(id, name, slug, parent_org_id)")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: true });

  const directOrgs = (memberships ?? [])
    .filter((m) => m.organizations)
    .map((m) => {
      const org = m.organizations as unknown as { id: string; name: string; slug: string; parent_org_id: string | null };
      return { id: org.id, name: org.name, slug: org.slug, role: m.role, parentOrgId: org.parent_org_id };
    });

  // Owned org IDs — fetch child workspaces of orgs this user owns
  const ownedOrgIds = directOrgs.filter((o) => o.role === "owner").map((o) => o.id);
  const directOrgIds = new Set(directOrgs.map((o) => o.id));

  let childOrgs: typeof directOrgs = [];
  if (ownedOrgIds.length > 0) {
    const { data: children } = await db
      .from("organizations")
      .select("id, name, slug, parent_org_id")
      .in("parent_org_id", ownedOrgIds);

    childOrgs = (children ?? [])
      .filter((o) => !directOrgIds.has(o.id))
      .map((o) => ({ id: o.id, name: o.name, slug: o.slug, role: "owner", parentOrgId: o.parent_org_id }));
  }

  return NextResponse.json({ orgs: [...directOrgs, ...childOrgs] });
}
