import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";

async function getMember(memberId: string, orgId: string) {
  const db = getServerDb();
  const { data } = await db
    .from("organization_members")
    .select("id, role, user_id")
    .eq("id", memberId)
    .eq("org_id", orgId)
    .single();
  return data;
}

// PATCH /api/org/members/[id] — change role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "owner" && session.role !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can change roles" }, { status: 403 });
  }

  const { id } = await params;
  const member = await getMember(id, session.orgId);
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (member.role === "owner") return NextResponse.json({ error: "Cannot change owner role" }, { status: 403 });
  // Prevent self-demotion for admins
  if (member.user_id === session.userId && session.role !== "owner") {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 403 });
  }

  const { role } = await req.json();
  if (!["admin", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const db = getServerDb();
  const { error } = await db
    .from("organization_members")
    .update({ role })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  return NextResponse.json({ ok: true, role });
}

// DELETE /api/org/members/[id] — remove member
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "owner" && session.role !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can remove members" }, { status: 403 });
  }

  const { id } = await params;
  const member = await getMember(id, session.orgId);
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (member.role === "owner") return NextResponse.json({ error: "Cannot remove the owner" }, { status: 403 });
  if (member.user_id === session.userId) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 403 });
  }

  const db = getServerDb();
  const { error } = await db
    .from("organization_members")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
