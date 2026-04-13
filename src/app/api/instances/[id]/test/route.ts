import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { N8nClient } from "@/lib/n8n";

// POST /api/instances/[id]/test — test connection without saving
// Body: { url: string, apiKey: string }
export async function POST(
  req: NextRequest,
  { params: _ }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const url: string = (body.url ?? "").trim().replace(/\/+$/, "");
  const apiKey: string = (body.apiKey ?? "").trim();

  if (!url || !apiKey) {
    return NextResponse.json({ error: "URL and API key are required" }, { status: 400 });
  }

  const client = new N8nClient(url, apiKey);
  const result = await client.testConnection();

  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
