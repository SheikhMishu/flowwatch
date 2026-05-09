import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.orgId === "org_demo") {
    return NextResponse.json({ orgs: [] });
  }

  const db = getServerDb();
  const { data } = await db
    .from("organization_members")
    .select("role, created_at, organizations(id, name, slug)")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: true });

  if (!data) return NextResponse.json({ orgs: [] });

  const orgs = data
    .filter((m) => m.organizations)
    .map((m) => {
      const org = m.organizations as unknown as { id: string; name: string; slug: string };
      return { id: org.id, name: org.name, slug: org.slug, role: m.role };
    });

  return NextResponse.json({ orgs });
}
