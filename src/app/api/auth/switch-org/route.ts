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
  const { data: membership } = await db
    .from("organization_members")
    .select("role, organizations(id, name)")
    .eq("user_id", session.userId)
    .eq("org_id", orgId)
    .single();

  if (!membership || !membership.organizations) {
    return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
  }

  const org = membership.organizations as unknown as { id: string; name: string };
  const token = await createSession({
    userId: session.userId,
    email: session.email,
    name: session.name,
    orgId: org.id,
    orgName: org.name,
    role: membership.role as OrgRole,
  });

  logger.info("Workspace switched", { category: "auth", userId: session.userId, fromOrg: session.orgId, toOrg: org.id });
  logActivity({ userId: session.userId, email: session.email, orgId: org.id }, "auth.workspace_switched", {
    metadata: { fromOrg: session.orgId, toOrg: org.id },
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set({ ...getSessionCookieOptions(), value: token });
  return response;
}
