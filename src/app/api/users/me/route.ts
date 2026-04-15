import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession, getSessionCookieOptions } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity";

// PATCH /api/users/me — update the current user's profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.orgId === "org_demo") {
      return NextResponse.json({ error: "Cannot edit profile in demo mode" }, { status: 403 });
    }

    const body = await req.json();
    const name: string = (body.name ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (name.length > 80) {
      return NextResponse.json({ error: "Name must be 80 characters or fewer" }, { status: 400 });
    }

    const db = getServerDb();
    const { data, error } = await db
      .from("users")
      .update({ name })
      .eq("id", session.userId)
      .select("id, name, email")
      .single();

    if (error) {
      logger.error("Failed to update user profile", { category: "api", orgId: session.orgId, userId: session.userId, err: error });
      return NextResponse.json({ error: "Failed to update profile", detail: error.message }, { status: 500 });
    }

    // Refresh the session cookie so the new name is reflected immediately
    const newToken = await createSession({
      userId: session.userId,
      email: session.email,
      name: data.name,
      orgId: session.orgId,
      orgName: session.orgName,
      role: session.role,
    });
    const cookieOptions = getSessionCookieOptions();
    const cookieStore = await cookies();
    cookieStore.set(cookieOptions.name, newToken, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      maxAge: cookieOptions.maxAge,
      path: cookieOptions.path,
    });

    logger.info("User profile updated", { category: "api", orgId: session.orgId, userId: session.userId });
    logActivity(session, "profile.updated", {
      metadata: { name: data.name },
    });

    return NextResponse.json({ user: { name: data.name, email: data.email } });
  } catch (err) {
    logger.error("PATCH /api/users/me unhandled error", { category: "api", err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
