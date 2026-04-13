import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";

// GET /api/alerts — list org's alert rules
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") return NextResponse.json({ alerts: [] });

  const db = getServerDb();
  const { data, error } = await db
    .from("alerts")
    .select("*")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  return NextResponse.json({ alerts: data ?? [] });
}

// POST /api/alerts — create alert rule
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") return NextResponse.json({ error: "Not available in demo" }, { status: 403 });
  if (session.role === "viewer") return NextResponse.json({ error: "Viewers cannot create alerts" }, { status: 403 });

  const body = await req.json();
  const { name, channel, destination, threshold_count, threshold_minutes, cooldown_minutes, workflow_id, instance_id } = body;

  if (!name?.trim() || !channel || !destination?.trim()) {
    return NextResponse.json({ error: "Name, channel, and destination are required" }, { status: 400 });
  }
  if (!["email", "slack", "webhook"].includes(channel)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  const db = getServerDb();
  const { data, error } = await db
    .from("alerts")
    .insert({
      org_id: session.orgId,
      instance_id: instance_id ?? null,
      workflow_id: workflow_id ?? null,
      name: name.trim(),
      channel,
      destination: destination.trim(),
      threshold_count: threshold_count ?? 1,
      threshold_minutes: threshold_minutes ?? 5,
      cooldown_minutes: cooldown_minutes ?? 60,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  return NextResponse.json({ alert: data }, { status: 201 });
}
