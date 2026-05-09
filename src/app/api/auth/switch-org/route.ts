import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession, getSessionCookieOptions } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import type { OrgRole } from "@/types";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.orgId === "org_demo") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const orgId: string = (body.orgId ?? "").trim();
  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  if (orgId === session.orgId) {
    return NextResponse.json({ ok: true });
  }

  const db = getServerDb();

  // Check direct membership first
  const { data: membership } = await db
    .from("organization_members")
    .select("role, organizations(id, name)")
    .eq("user_id", session.userId)
    .eq("org_id", orgId)
    .single();

  let org: { id: string; name: string };
  let role: string;

  if (membership && membership.organizations) {
    org = membership.organizations as unknown as { id: string; name: string };
    role = membership.role;
  } else {
    // Check implicit access: user is owner of the target org's parent
    const { data: targetOrg } = await db
      .from("organizations")
      .select("id, name, parent_org_id")
      .eq("id", orgId)
      .single();

    if (!targetOrg?.parent_org_id) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    const { data: parentMembership } = await db
      .from("organization_members")
      .select("role")
      .eq("org_id", targetOrg.parent_org_id)
      .eq("user_id", session.userId)
      .single();

    if (!parentMembership || parentMembership.role !== "owner") {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    org = { id: targetOrg.id, name: targetOrg.name };
    role = "owner";
  }
  const token = await createSession({
    userId: session.userId,
    email: session.email,
    name: session.name,
    orgId: org.id,
    orgName: org.name,
    role: role as OrgRole,
  });

  logger.info("Workspace switched", { category: "auth", userId: session.userId, fromOrg: session.orgId, toOrg: org.id });
  logActivity({ userId: session.userId, email: session.email, orgId: org.id }, "auth.workspace_switched", {
    metadata: { fromOrg: session.orgId, toOrg: org.id },
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set({ ...getSessionCookieOptions(), value: token });
  return response;
}
