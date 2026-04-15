import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { getAiDebug, type AiTier } from "@/lib/ai-debug";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity";

// ─── Resolve org plan → AI tier ───────────────────────────────────────────────

async function getOrgTier(orgId: string): Promise<AiTier> {
  if (orgId === "org_demo") return "free";
  const db = getServerDb();
  const { data } = await db
    .from("organizations")
    .select("plan")
    .eq("id", orgId)
    .single();
  const plan = data?.plan ?? "free";
  return plan === "free" ? "free" : "pro";
}

// ─── POST /api/ai/explain ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const {
    workflowId,
    workflowName,
    failedNode,
    errorMessage,
    errorType,
    nodeType,
    inputItems,
  } = body as {
    workflowId: string;
    workflowName?: string;
    failedNode?: string | null;
    errorMessage?: string | null;
    errorType?: string | null;
    nodeType?: string | null;
    inputItems?: unknown[];
  };

  if (!workflowId || !errorMessage) {
    return NextResponse.json({ error: "workflowId and errorMessage are required" }, { status: 400 });
  }

  const tier = await getOrgTier(session.orgId);

  logger.info("AI explain requested", { category: "ai", orgId: session.orgId, userId: session.userId, tier, workflowId });

  try {
    const result = await getAiDebug(
      {
        workflowId,
        workflowName: workflowName ?? "Unknown workflow",
        failedNode: failedNode ?? null,
        errorMessage,
        errorType: errorType ?? null,
        nodeType: nodeType ?? null,
        inputItems: inputItems ?? [],
      },
      tier,
    );

    logger.info("AI explain complete", {
      category: "ai",
      orgId: session.orgId,
      userId: session.userId,
      tier: result.tier,
      model: result.model,
      cached: result.cached,
      workflowId,
    });
    logActivity(session, "ai.explain_requested", {
      resourceType: "workflow",
      resourceId: workflowId,
      metadata: { tier: result.tier, cached: result.cached, model: result.model },
    });

    return NextResponse.json({ result });
  } catch (err) {
    logger.error("AI explain failed", { category: "ai", orgId: session.orgId, userId: session.userId, tier, workflowId, err });
    return NextResponse.json(
      { error: "AI analysis failed. Please try again." },
      { status: 500 },
    );
  }
}
