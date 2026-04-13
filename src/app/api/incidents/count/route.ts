import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { mockIncidents } from "@/lib/mock-data";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ open: 0 });

  if (session.orgId === "org_demo") {
    const open = mockIncidents.filter((i) => i.status === "open").length;
    return NextResponse.json({ open });
  }

  const db = getServerDb();
  const { count } = await db
    .from("incidents")
    .select("id", { count: "exact", head: true })
    .eq("org_id", session.orgId)
    .eq("status", "open");

  return NextResponse.json({ open: count ?? 0 });
}
