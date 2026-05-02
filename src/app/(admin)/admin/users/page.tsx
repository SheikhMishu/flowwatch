import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { UsersClient } from "./users-client";

export const dynamic = "force-dynamic";

export type OrgMembership = {
  org_id: string;
  role: string;
  org: {
    id: string;
    name: string;
    plan: string;
  } | null;
};

export type EnrichedUser = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  is_super_admin: boolean | null;
  orgs: OrgMembership[];
};

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getServerDb();

  const { data: adminUser } = await db
    .from("users")
    .select("is_super_admin")
    .eq("id", session.userId)
    .single();
  if (!adminUser?.is_super_admin) redirect("/dashboard");

  const { data: users } = await db
    .from("users")
    .select("id, email, name, created_at, is_super_admin")
    .order("created_at", { ascending: false })
    .limit(10000);

  const { data: memberships } = await db
    .from("organization_members")
    .select("user_id, role, org_id, organizations(id, name, plan)")
    .in("user_id", (users ?? []).map((u) => u.id))
    .limit(10000);

  const enriched: EnrichedUser[] = (users ?? []).map((user) => ({
    ...user,
    orgs: (memberships ?? [])
      .filter((m) => m.user_id === user.id)
      .map((m) => ({
        org_id: m.org_id,
        role: m.role,
        org: m.organizations as unknown as OrgMembership["org"],
      })),
  }));

  return <UsersClient users={enriched} />;
}
