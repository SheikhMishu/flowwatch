import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

// PATCH /api/instances/[id] — update name, url, and/or API key
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "viewer") return NextResponse.json({ error: "Viewers cannot edit instances" }, { status: 403 });
  if (session.orgId === "org_demo") return NextResponse.json({ error: "Not available in demo" }, { status: 403 });

  const { id } = await params;
  const db = getServerDb();

  const { data: existing } = await db
    .from("n8n_instances")
    .select("id")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .single();

  if (!existing) return NextResponse.json({ error: "Instance not found" }, { status: 404 });

  const body = await req.json();
  const updates: Record<string, string> = {};

  if (body.name?.trim()) updates.name = body.name.trim();
  if (body.url?.trim()) updates.url = body.url.trim().replace(/\/+$/, "");
  if (body.apiKey?.trim()) {
    updates.api_key_encrypted = encrypt(body.apiKey.trim());
    updates.api_key_hint = `••••${body.apiKey.trim().slice(-4)}`;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: updated, error } = await db
    .from("n8n_instances")
    .update(updates)
    .eq("id", id)
    .select("id, name, url, api_key_hint, is_active, last_synced_at")
    .single();

  if (error) return NextResponse.json({ error: "Failed to update instance" }, { status: 500 });

  return NextResponse.json({ ok: true, instance: updated });
}

// DELETE /api/instances/[id] — disconnect (soft delete via is_active=false, or hard delete)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "viewer") return NextResponse.json({ error: "Viewers cannot remove instances" }, { status: 403 });

  const { id } = await params;
  const db = getServerDb();

  // Verify instance belongs to this org
  const { data: instance } = await db
    .from("n8n_instances")
    .select("id")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .single();

  if (!instance) return NextResponse.json({ error: "Instance not found" }, { status: 404 });

  const { error } = await db.from("n8n_instances").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to remove instance" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
