import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { N8nClient } from "@/lib/n8n";

// POST /api/executions/[id]/retry
// [id] = "instanceId:n8nExecutionId" (same composite format used throughout the app)

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") return NextResponse.json({ error: "Not available in demo mode" }, { status: 403 });

  const { id: rawId } = await params;
  const compositeId = decodeURIComponent(rawId);
  const colonIdx = compositeId.indexOf(":");
  if (colonIdx === -1) return NextResponse.json({ error: "Invalid execution ID" }, { status: 400 });

  const instanceId = compositeId.slice(0, colonIdx);
  const n8nExecutionId = compositeId.slice(colonIdx + 1);

  const db = getServerDb();
  const { data: inst } = await db
    .from("n8n_instances")
    .select("url, api_key_encrypted")
    .eq("id", instanceId)
    .eq("org_id", session.orgId)
    .eq("is_active", true)
    .single();

  if (!inst) return NextResponse.json({ error: "Instance not found" }, { status: 404 });

  let apiKey: string;
  try {
    apiKey = decrypt(inst.api_key_encrypted);
  } catch {
    return NextResponse.json({ error: "Failed to decrypt API key" }, { status: 500 });
  }

  const client = new N8nClient(inst.url, apiKey);
  try {
    const result = await client.retryExecution(n8nExecutionId);
    return NextResponse.json({ ok: true, newExecutionId: result.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Retry failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
