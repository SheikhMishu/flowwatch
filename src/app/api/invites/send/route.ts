import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { sendInviteEmail } from "@/lib/email";
import { getPlanLimits } from "@/lib/plans";
import type { OrgRole } from "@/types";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "owner" && session.role !== "admin") {
      return NextResponse.json({ error: "Only owners and admins can invite teammates" }, { status: 403 });
    }

    const body = await req.json();
    const email: string = (body.email ?? "").toLowerCase().trim();
    const role: OrgRole = body.role ?? "viewer";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!["admin", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const db = getServerDb();

    // Enforce plan member limit
    const [{ data: orgData }, { count: memberCount }, { count: pendingCount }] = await Promise.all([
      db.from("organizations").select("plan").eq("id", session.orgId).single(),
      db.from("organization_members").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
      db.from("organization_invites")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString()),
    ]);
    const plan = orgData?.plan ?? "free";
    const limits = getPlanLimits(plan);
    if (limits.members !== null && (memberCount ?? 0) + (pendingCount ?? 0) >= limits.members) {
      return NextResponse.json(
        {
          error: `Your ${plan} plan allows up to ${limits.members} team member${limits.members !== 1 ? "s" : ""}. Upgrade to invite more.`,
          limitReached: true,
          currentPlan: plan,
        },
        { status: 403 }
      );
    }

    // Check if already a member
    const { data: existingMember } = await db
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingMember) {
      const { data: membership } = await db
        .from("organization_members")
        .select("id")
        .eq("org_id", session.orgId)
        .eq("user_id", existingMember.id)
        .single();

      if (membership) {
        return NextResponse.json({ error: "This person is already a member of your organization" }, { status: 409 });
      }
    }

    // Check for existing pending invite
    const { data: existingInvite } = await db
      .from("organization_invites")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("email", email)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: "An invitation has already been sent to this email" }, { status: 409 });
    }

    // Create invite token (crypto.randomUUID gives 36-char UUID)
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await db.from("organization_invites").insert({
      org_id: session.orgId,
      email,
      role,
      token,
      expires_at: expiresAt,
      invited_by: session.userId,
    });

    if (insertError) {
      logger.error("Failed to create invite", { category: "invite", orgId: session.orgId, email, err: insertError });
      return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/invite/${token}`;

    await sendInviteEmail(email, session.orgName, session.name || session.email, inviteUrl);

    logger.info("Team member invited", { category: "invite", orgId: session.orgId, invitedEmail: email, role });
    logActivity(session, "team.member_invited", {
      metadata: { invitedEmail: email, role },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("invite/send unhandled error", { category: "invite", err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
