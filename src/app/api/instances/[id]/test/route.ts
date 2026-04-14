import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { N8nClient } from "@/lib/n8n";

// POST /api/instances/[id]/test
// Body { url, apiKey } → test those credentials (used by Add modal, id is ignored)
// Empty body            → test stored credentials for the given instance id
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let url: string;
  let apiKey: string;

  // Try to parse a body — if empty or missing url/apiKey, use stored credentials
  let body: Record<string, string> = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine
  }

  if (body.url?.trim() && body.apiKey?.trim()) {
    url = body.url.trim().replace(/\/+$/, "");
    apiKey = body.apiKey.trim();
  } else {
    // Use stored credentials — requires a real instance id (not "placeholder")
    const db = getServerDb();
    const { data: instance } = await db
      .from("n8n_instances")
      .select("url, api_key_encrypted")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .single();

    if (!instance) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 });
    }

    url = instance.url;
    try {
      apiKey = decrypt(instance.api_key_encrypted);
    } catch {
      return NextResponse.json({ error: "Could not decrypt stored API key" }, { status: 500 });
    }
  }

  const client = new N8nClient(url, apiKey);
  const result = await client.testConnection();

  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
