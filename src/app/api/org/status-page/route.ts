import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

// GET /api/org/status-page — fetch current status page settings
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") {
    return NextResponse.json({ slug: "demo", status_page_enabled: false });
  }

  const db = getServerDb();
  const { data, error } = await db
    .from("organizations")
    .select("slug, status_page_enabled")
    .eq("id", session.orgId)
    .single();

  if (error) {
    logger.error("Failed to fetch status page settings", { category: "api", orgId: session.orgId, err: error });
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }

  return NextResponse.json({ slug: data.slug ?? "", status_page_enabled: data.status_page_enabled });
}

// PATCH /api/org/status-page — update slug and/or enabled flag
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") {
    return NextResponse.json({ error: "Not available in demo mode" }, { status: 403 });
  }
  if (session.role !== "owner") {
    return NextResponse.json({ error: "Only the workspace owner can manage the status page" }, { status: 403 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if ("status_page_enabled" in body) {
    updates.status_page_enabled = Boolean(body.status_page_enabled);
  }

  if ("slug" in body) {
    const slug = String(body.slug).toLowerCase().trim().replace(/[^a-z0-9-]/g, "-");
    if (slug.length < 3 || slug.length > 48) {
      return NextResponse.json({ error: "Slug must be 3–48 characters" }, { status: 400 });
    }
    updates.slug = slug;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const db = getServerDb();
  const { data, error } = await db
    .from("organizations")
    .update(updates)
    .eq("id", session.orgId)
    .select("slug, status_page_enabled")
    .single();

  if (error) {
    // Slug uniqueness violation
    if (error.code === "23505") {
      return NextResponse.json({ error: "That slug is already taken. Try another." }, { status: 409 });
    }
    logger.error("Failed to update status page settings", { category: "api", orgId: session.orgId, err: error });
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }

  logger.info("Status page settings updated", { category: "api", orgId: session.orgId, updates });
  logActivity(session, "org.status_page_updated", {
    resourceType: "org",
    resourceId: session.orgId,
    metadata: updates,
  });

  return NextResponse.json({ slug: data.slug ?? "", status_page_enabled: data.status_page_enabled });
}
