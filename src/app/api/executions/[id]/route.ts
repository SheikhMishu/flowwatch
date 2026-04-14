import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchExecutionWithData } from "@/lib/n8n-data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") return NextResponse.json({ nodes: [] });

  const { id } = await params;
  const compositeId = decodeURIComponent(id);

  const execution = await fetchExecutionWithData(session.orgId, compositeId).catch(() => null);
  if (!execution) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ nodes: execution.data?.nodes ?? [] });
}
