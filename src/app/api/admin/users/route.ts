import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getServerDb();
  const { data: adminUser } = await db.from("users").select("is_super_admin").eq("id", session.userId).single();
  if (!adminUser?.is_super_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const search = req.nextUrl.searchParams.get("search") ?? "";

  let usersQuery = db
    .from("users")
    .select("id, email, name, created_at, is_super_admin")
    .order("created_at", { ascending: false });

  if (search) {
    usersQuery = usersQuery.ilike("email", `%${search}%`);
  }

  const { data: users } = await usersQuery;

  if (!users || users.length === 0) {
    return NextResponse.json({ users: [] });
  }

  const userIds = users.map((u) => u.id);

  const { data: memberships } = await db
    .from("organization_members")
    .select("user_id, role, org_id, organization:organizations(id, name, plan)")
    .in("user_id", userIds);

  const membershipMap: Record<string, Array<{ org_id: string; org_name: string; plan: string; role: string }>> = {};
  for (const m of memberships ?? []) {
    if (!membershipMap[m.user_id]) membershipMap[m.user_id] = [];
    const org = m.organization as unknown as { id: string; name: string; plan: string } | null;
    membershipMap[m.user_id].push({
      org_id: m.org_id,
      org_name: org?.name ?? "",
      plan: org?.plan ?? "",
      role: m.role,
    });
  }

  const result = users.map((u) => ({
    ...u,
    orgs: membershipMap[u.id] ?? [],
  }));

  return NextResponse.json({ users: result });
}
