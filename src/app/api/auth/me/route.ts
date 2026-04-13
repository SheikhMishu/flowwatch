import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// GET /api/auth/me — returns current session info for client components
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      userId: session.userId,
      email: session.email,
      name: session.name,
      orgId: session.orgId,
      orgName: session.orgName,
      role: session.role,
    },
  });
}
