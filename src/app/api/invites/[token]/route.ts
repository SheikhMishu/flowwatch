import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "Invalid invite link" }, { status: 400 });
    }

    const db = getServerDb();

    const { data: invite, error } = await db
      .from("organization_invites")
      .select(`
        id,
        email,
        role,
        expires_at,
        accepted_at,
        organizations ( name )
      `)
      .eq("token", token)
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.accepted_at) {
      return NextResponse.json({ error: "This invitation has already been accepted" }, { status: 410 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "This invitation has expired" }, { status: 410 });
    }

    const org = invite.organizations as unknown as { name: string };

    return NextResponse.json({
      email: invite.email,
      role: invite.role,
      orgName: org.name,
    });
  } catch (err) {
    console.error("invites/[token] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
