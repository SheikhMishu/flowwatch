import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { getAiDebug, type AiTier } from "@/lib/ai-debug";
import { getPlanLimits } from "@/lib/plans";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activity";

// ─── Resolve org plan → AI tier + monthly limit ───────────────────────────────

async function getOrgAiConfig(orgId: string): Promise<{ tier: AiTier; monthlyLimit: number | null }> {
  if (orgId === "org_demo") return { tier: "free", monthlyLimit: null };
  const db = getServerDb();
  const { data } = await db
    .from("organizations")
    .select("plan")
    .eq("id", orgId)
    .single();
  const plan = data?.plan ?? "free";
  const limits = getPlanLimits(plan);
  const tier: AiTier = plan === "free" ? "free" : "pro";
  return { tier, monthlyLimit: limits.aiRequestsPerMonth };
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

  const { tier, monthlyLimit } = await getOrgAiConfig(session.orgId);

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
      session.orgId,
      monthlyLimit,
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
    // Monthly limit reached — return a user-friendly 429
    if (err instanceof Error && err.message.startsWith("LIMIT_REACHED:")) {
      const limit = err.message.split(":")[1];
      return NextResponse.json(
        { error: `You've used all ${limit} AI analyses for this month. Resets on the 1st.` },
        { status: 429 },
      );
    }
    logger.error("AI explain failed", { category: "ai", orgId: session.orgId, userId: session.userId, tier, workflowId, err });
    return NextResponse.json(
      { error: "AI analysis failed. Please try again." },
      { status: 500 },
    );
  }
}
