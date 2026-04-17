import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { N8nClient } from "@/lib/n8n";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity";
import { getPlanLimits } from "@/lib/plans";

// GET /api/instances — list org's instances
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") return NextResponse.json({ instances: [] });

  const db = getServerDb();
  const { data, error } = await db
    .from("n8n_instances")
    .select("id, org_id, name, url, api_key_hint, is_active, last_synced_at, created_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: true });

  if (error) {
    logger.error("Failed to fetch instances", { category: "instance", orgId: session.orgId, err: error });
    return NextResponse.json({ error: "Failed to fetch instances" }, { status: 500 });
  }
  logger.info("Instances fetched", { category: "instance", orgId: session.orgId, count: (data ?? []).length });
  return NextResponse.json({ instances: data ?? [] });
}

// POST /api/instances — add new instance
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.orgId === "org_demo") return NextResponse.json({ error: "Cannot add instances in demo mode" }, { status: 403 });
  if (session.role === "viewer") return NextResponse.json({ error: "Viewers cannot add instances" }, { status: 403 });

  const body = await req.json();
  const name: string = (body.name ?? "").trim();
  const url: string = (body.url ?? "").trim().replace(/\/+$/, "");
  const apiKey: string = (body.apiKey ?? "").trim();

  if (!name || !url || !apiKey) {
    return NextResponse.json({ error: "Name, URL, and API key are required" }, { status: 400 });
  }

  // Enforce plan instance limit
  const db = getServerDb();
  const [{ data: orgData }, { count: instanceCount }] = await Promise.all([
    db.from("organizations").select("plan").eq("id", session.orgId).single(),
    db.from("n8n_instances").select("id", { count: "exact", head: true }).eq("org_id", session.orgId).eq("is_active", true),
  ]);
  const plan = orgData?.plan ?? "free";
  const limits = getPlanLimits(plan);
  if ((instanceCount ?? 0) >= limits.instances) {
    return NextResponse.json(
      {
        error: `Your ${plan} plan allows up to ${limits.instances} instance${limits.instances !== 1 ? "s" : ""}. Upgrade your plan to add more.`,
        limitReached: true,
        currentPlan: plan,
      },
      { status: 403 }
    );
  }

  // Test connection before saving
  const client = new N8nClient(url, apiKey);
  const test = await client.testConnection();
  if (!test.ok) {
    return NextResponse.json(
      { error: `Could not connect to n8n: ${test.error}` },
      { status: 422 }
    );
  }

  const apiKeyHint = `••••${apiKey.slice(-4)}`;
  const apiKeyEncrypted = encrypt(apiKey);

  const { data, error } = await db
    .from("n8n_instances")
    .insert({
      org_id: session.orgId,
      name,
      url,
      api_key_encrypted: apiKeyEncrypted,
      api_key_hint: apiKeyHint,
      is_active: true,
      last_synced_at: new Date().toISOString(),
    })
    .select("id, org_id, name, url, api_key_hint, is_active, last_synced_at, created_at")
    .single();

  if (error) {
    logger.error("Failed to create instance", { category: "instance", orgId: session.orgId, err: error });
    return NextResponse.json({ error: "Failed to save instance" }, { status: 500 });
  }

  logger.info("Instance created", { category: "instance", orgId: session.orgId, instanceId: data.id, instanceName: name });
  logActivity(session, "instance.created", {
    resourceType: "instance",
    resourceId: data.id,
    metadata: { name, url },
  });

  return NextResponse.json({ instance: data }, { status: 201 });
}
