import { NextRequest, NextResponse } from "next/server";
import { createSession, getSessionCookieOptions } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import type { OrgRole } from "@/types";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId: string = (body.userId ?? "").trim();
    const email: string = (body.email ?? "").toLowerCase().trim();
    const orgName: string = (body.orgName ?? "").trim();

    // Validate
    if (!userId || !email) {
      return NextResponse.json({ error: "userId and email are required" }, { status: 400 });
    }
    if (!orgName || orgName.length < 2 || orgName.length > 50) {
      return NextResponse.json(
        { error: "Organization name must be between 2 and 50 characters" },
        { status: 400 }
      );
    }

    const db = getServerDb();

    // ── Verify the user exists ─────────────────────────────────────────────────
    const { data: user, error: userError } = await db
      .from("users")
      .select("id, email, name")
      .eq("id", userId)
      .eq("email", email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Generate unique slug ───────────────────────────────────────────────────
    let slug = slugify(orgName);
    if (!slug) slug = randomSuffix();

    const { data: slugConflict } = await db
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single();

    if (slugConflict) {
      slug = `${slug}-${randomSuffix()}`;
    }

    // ── Create organization ────────────────────────────────────────────────────
    const { data: org, error: orgError } = await db
      .from("organizations")
      .insert({ name: orgName, slug, plan: "free" })
      .select("id, name, slug")
      .single();

    if (orgError || !org) {
      logger.error("Failed to create organization", { category: "auth", userId, email, err: orgError });
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
    }

    // ── Create owner membership ────────────────────────────────────────────────
    const { error: memberError } = await db.from("organization_members").insert({
      org_id: org.id,
      user_id: user.id,
      role: "owner",
      invited_by: null,
    });

    if (memberError) {
      logger.error("Failed to create membership", { category: "auth", userId, orgId: org.id, err: memberError });
      // Rollback org (best effort)
      await db.from("organizations").delete().eq("id", org.id);
      return NextResponse.json({ error: "Failed to set up organization membership" }, { status: 500 });
    }

    // ── Create full session ────────────────────────────────────────────────────
    const token = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name ?? user.email,
      orgId: org.id,
      orgName: org.name,
      role: "owner" as OrgRole,
    });

    logger.info("Organization created", { category: "auth", userId, orgId: org.id, orgName: org.name });
    logActivity({ userId: user.id, email: user.email, orgId: org.id }, "auth.org_created", {
      resourceType: "organization",
      resourceId: org.id,
      metadata: { orgName: org.name },
    });

    const response = NextResponse.json({ ok: true, redirect: "/dashboard" });
    response.cookies.set({ ...getSessionCookieOptions(), value: token });
    return response;
  } catch (err) {
    logger.error("create-org unhandled error", { category: "auth", err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
