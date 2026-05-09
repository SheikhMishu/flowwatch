import { NextRequest, NextResponse } from "next/server";
import { createSession, getSessionCookieOptions } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import type { OrgRole } from "@/types";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity";

// Used at login time when a user belongs to multiple workspaces.
// The userId + email come from the verify-pin response (user has already
// proven ownership of the email address via PIN).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId: string = (body.userId ?? "").trim();
    const email: string = (body.email ?? "").toLowerCase().trim();
    const orgId: string = (body.orgId ?? "").trim();

    if (!userId || !email || !orgId) {
      return NextResponse.json({ error: "userId, email, and orgId are required" }, { status: 400 });
    }

    const db = getServerDb();

    // Verify the user exists with that exact email (guards against forged userId)
    const { data: user } = await db
      .from("users")
      .select("id, email, name")
      .eq("id", userId)
      .eq("email", email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 403 });
    }

    // Verify membership in the requested org
    const { data: membership } = await db
      .from("organization_members")
      .select("role, organizations(id, name)")
      .eq("user_id", userId)
      .eq("org_id", orgId)
      .single();

    if (!membership || !membership.organizations) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    const org = membership.organizations as unknown as { id: string; name: string };
    const token = await createSession({
      userId,
      email,
      name: user.name ?? email,
      orgId: org.id,
      orgName: org.name,
      role: membership.role as OrgRole,
    });

    logger.info("Workspace selected at login", { category: "auth", userId, orgId });
    logActivity({ userId, email, orgId }, "auth.login");

    const response = NextResponse.json({ ok: true, redirect: "/dashboard" });
    response.cookies.set({ ...getSessionCookieOptions(), value: token });
    return response;
  } catch (err) {
    logger.error("select-org unhandled error", { category: "auth", err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
