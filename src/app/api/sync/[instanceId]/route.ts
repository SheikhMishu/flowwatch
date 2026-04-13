import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { syncInstance } from "@/lib/sync";

// POST /api/sync/[instanceId] — full data sync for a single instance
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") return NextResponse.json({ error: "Not available in demo" }, { status: 403 });

  const { instanceId } = await params;
  const result = await syncInstance(instanceId, session.orgId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json(result);
}
