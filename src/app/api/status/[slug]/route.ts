import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/status/[slug] — public, no auth required
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = getServerDb();

  // Look up org by slug — must have status page enabled
  const { data: org } = await db
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("status_page_enabled", true)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Status page not found" }, { status: 404 });
  }

  // Fetch instances (name + last_synced_at only — no sensitive data)
  const { data: instances } = await db
    .from("n8n_instances")
    .select("id, name, last_synced_at")
    .eq("org_id", org.id)
    .order("name");

  // Count open incidents
  const { count: openIncidents } = await db
    .from("incidents")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org.id)
    .eq("status", "open");

  const now = new Date();

  const instancesWithStatus = (instances ?? []).map((inst) => {
    let status: "operational" | "degraded" | "issue" | "unknown";
    if (!inst.last_synced_at) {
      status = "unknown";
    } else {
      const diffMin = (now.getTime() - new Date(inst.last_synced_at).getTime()) / 60000;
      if (diffMin <= 15) status = "operational";
      else if (diffMin <= 60) status = "degraded";
      else status = "issue";
    }
    return { name: inst.name, status, last_synced_at: inst.last_synced_at };
  });

  return NextResponse.json({
    org: { name: org.name, slug: org.slug },
    instances: instancesWithStatus,
    open_incidents: openIncidents ?? 0,
    checked_at: now.toISOString(),
  });
}
