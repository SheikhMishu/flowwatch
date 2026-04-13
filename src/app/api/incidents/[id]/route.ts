import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") return NextResponse.json({ error: "Demo mode" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { status } = body as { status?: string };

  if (!status || !["open", "investigating", "resolved"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = getServerDb();
  const update: Record<string, unknown> = { status };
  if (status === "resolved") update.resolved_at = new Date().toISOString();

  const { data, error } = await db
    .from("incidents")
    .update(update)
    .eq("id", id)
    .eq("org_id", session.orgId)
    .select()
    .single();

  if (error) {
    console.error("[PATCH /api/incidents/:id]", error.message);
    return NextResponse.json({ error: "Failed to update incident" }, { status: 500 });
  }

  return NextResponse.json({ incident: data });
}
