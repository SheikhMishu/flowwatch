// Migration required (run once in Supabase SQL editor):
//   ALTER TABLE pin_verifications ADD COLUMN IF NOT EXISTS failed_attempts int NOT NULL DEFAULT 0;

import { NextRequest, NextResponse } from "next/server";
import { verifyPin } from "@/lib/pin";
import { createSession, getSessionCookieOptions } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import type { OrgRole } from "@/types";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity";

const MAX_PIN_ATTEMPTS = 5;

const DEMO_EMAIL = "demo@flowmonix.com";
const DEMO_PIN = "123456";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string = (body.email ?? "").toLowerCase().trim();
    const pin: string = (body.pin ?? "").trim();
    const inviteToken: string | undefined = body.inviteToken?.trim() || undefined;

    if (!email || !pin) {
      return NextResponse.json({ error: "Email and PIN are required" }, { status: 400 });
    }

    // ── Demo shortcut ──────────────────────────────────────────────────────────
    if (email === DEMO_EMAIL && pin === DEMO_PIN) {
      const token = await createSession({
        userId: "demo_01",
        email: DEMO_EMAIL,
        name: "Demo User",
        orgId: "org_demo",
        orgName: "Demo Org",
        role: "owner" as OrgRole,
      });
      const response = NextResponse.json({ ok: true, redirect: "/dashboard" });
      response.cookies.set({ ...getSessionCookieOptions(), value: token });
      return response;
    }

    const db = getServerDb();

    // ── Find the latest valid (unexpired, unused) PIN for this email ───────────
    const { data: pinRecord, error: pinError } = await db
      .from("pin_verifications")
      .select("id, pin_hash, expires_at, used_at, failed_attempts")
      .eq("email", email)
      .gt("expires_at", new Date().toISOString())
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (pinError || !pinRecord) {
      return NextResponse.json(
        { error: "Invalid or expired PIN. Please request a new one." },
        { status: 401 }
      );
    }

    // ── Brute-force guard ──────────────────────────────────────────────────────
    if ((pinRecord.failed_attempts ?? 0) >= MAX_PIN_ATTEMPTS) {
      // Invalidate the PIN so the user must request a new one
      await db
        .from("pin_verifications")
        .update({ used_at: new Date().toISOString() })
        .eq("id", pinRecord.id);
      logger.warn("PIN locked after too many attempts", { category: "auth", email });
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new PIN." },
        { status: 429 }
      );
    }

    // ── Verify PIN hash ────────────────────────────────────────────────────────
    const valid = await verifyPin(pin, pinRecord.pin_hash);
    if (!valid) {
      // Increment failed attempt counter
      await db
        .from("pin_verifications")
        .update({ failed_attempts: (pinRecord.failed_attempts ?? 0) + 1 })
        .eq("id", pinRecord.id);
      logger.warn("PIN verification failed", { category: "auth", email });
      logActivity({ orgId: "unknown", email }, "auth.pin_failed");
      const remaining = MAX_PIN_ATTEMPTS - (pinRecord.failed_attempts ?? 0) - 1;
      return NextResponse.json(
        { error: remaining > 0 ? `Incorrect PIN. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` : "Incorrect PIN. Request a new one." },
        { status: 401 }
      );
    }

    // ── Mark PIN as used ───────────────────────────────────────────────────────
    await db
      .from("pin_verifications")
      .update({ used_at: new Date().toISOString() })
      .eq("id", pinRecord.id);

    // ── Upsert user ────────────────────────────────────────────────────────────
    // Try to find existing user first
    const { data: existingUser } = await db
      .from("users")
      .select("id, email, name")
      .eq("email", email)
      .single();

    let userId: string;
    let userName: string | null;

    if (existingUser) {
      userId = existingUser.id;
      userName = existingUser.name;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await db
        .from("users")
        .insert({ email })
        .select("id, email, name")
        .single();

      if (createError || !newUser) {
        logger.error("Failed to create user", { category: "auth", email, err: createError });
        return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
      }
      userId = newUser.id;
      userName = newUser.name;
    }

    // ── Invite token path ──────────────────────────────────────────────────────
    if (inviteToken) {
      const { data: invite, error: inviteError } = await db
        .from("organization_invites")
        .select(`
          id,
          email,
          role,
          expires_at,
          accepted_at,
          org_id,
          organizations ( id, name )
        `)
        .eq("token", inviteToken)
        .single();

      if (inviteError || !invite) {
        return NextResponse.json({ error: "Invalid invite link" }, { status: 400 });
      }
      if (invite.accepted_at) {
        return NextResponse.json({ error: "This invitation has already been accepted" }, { status: 400 });
      }
      if (new Date(invite.expires_at) < new Date()) {
        return NextResponse.json({ error: "This invitation has expired" }, { status: 400 });
      }
      if (invite.email !== email) {
        return NextResponse.json({ error: "This invitation was sent to a different email address" }, { status: 400 });
      }

      const org = invite.organizations as unknown as { id: string; name: string };

      // Add to org (upsert in case of race)
      await db.from("organization_members").upsert(
        { org_id: org.id, user_id: userId, role: invite.role },
        { onConflict: "org_id,user_id" }
      );

      // Mark invite accepted
      await db
        .from("organization_invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id);

      const sessionToken = await createSession({
        userId,
        email,
        name: userName ?? email,
        orgId: org.id,
        orgName: org.name,
        role: invite.role as OrgRole,
      });
      const inviteSession = { userId, email, orgId: org.id };
      logger.info("PIN verified — invite login", { category: "auth", userId, email, orgId: org.id });
      logActivity(inviteSession, "auth.login");
      const response = NextResponse.json({ ok: true, redirect: "/dashboard" });
      response.cookies.set({ ...getSessionCookieOptions(), value: sessionToken });
      return response;
    }

    // ── Look up org membership ─────────────────────────────────────────────────
    const { data: membership } = await db
      .from("organization_members")
      .select(`
        role,
        organizations (
          id,
          name
        )
      `)
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (membership && membership.organizations) {
      // Has org — create full session
      const org = membership.organizations as unknown as { id: string; name: string };
      const token = await createSession({
        userId,
        email,
        name: userName ?? email,
        orgId: org.id,
        orgName: org.name,
        role: membership.role as OrgRole,
      });
      logger.info("PIN verified — login", { category: "auth", userId, email, orgId: org.id });
      logActivity({ userId, email, orgId: org.id }, "auth.login");
      const response = NextResponse.json({ ok: true, redirect: "/dashboard" });
      response.cookies.set({ ...getSessionCookieOptions(), value: token });
      return response;
    }

    // ── No org yet — ask the frontend to collect org name ─────────────────────
    return NextResponse.json({
      ok: true,
      needsOrg: true,
      userId,
      email,
    });
  } catch (err) {
    logger.error("verify-pin unhandled error", { category: "auth", err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
