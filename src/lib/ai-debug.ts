import Anthropic from "@anthropic-ai/sdk";
import { getServerDb } from "@/lib/db";
import { generateErrorSignature } from "@/lib/error-signature";
import { logger } from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AiTier = "free" | "pro";

export interface AiDebugInput {
  workflowId: string;
  workflowName: string;
  failedNode: string | null;
  errorMessage: string | null;
  errorType: string | null;
  nodeType?: string | null;
  inputItems?: unknown[];
}

export interface AiDebugResult {
  tier: AiTier;
  model: string;
  // Free tier: only raw_response is set
  raw_response: string;
  // Pro tier: structured fields
  cause?: string;
  fix_steps?: string[];
  prevention?: string;
  cached: boolean;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

async function getCached(
  signature: string,
  tier: AiTier,
): Promise<AiDebugResult | null> {
  const db = getServerDb();
  const { data } = await db
    .from("ai_analyses")
    .select("*")
    .eq("error_signature", signature)
    .eq("tier", tier)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  return {
    tier,
    model: data.model,
    raw_response: data.raw_response,
    cause: data.cause ?? undefined,
    fix_steps: data.fix_steps ?? undefined,
    prevention: data.prevention ?? undefined,
    cached: true,
  };
}

async function storeResult(
  signature: string,
  result: Omit<AiDebugResult, "cached">,
) {
  const db = getServerDb();
  await db.from("ai_analyses").insert({
    error_signature: signature,
    tier: result.tier,
    model: result.model,
    raw_response: result.raw_response,
    cause: result.cause ?? null,
    fix_steps: result.fix_steps ?? null,
    prevention: result.prevention ?? null,
  });
}

// ─── Free path — OpenRouter ───────────────────────────────────────────────────

// "openrouter/free" auto-routes to available free models (50 req/day free, 1000/day with credits)
// Override via OPENROUTER_FREE_MODEL env var to pin a specific model
const FREE_MODEL = process.env.OPENROUTER_FREE_MODEL ?? "openrouter/free";

async function callOpenRouter(input: AiDebugInput): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const prompt = [
    `Explain this n8n workflow error in 2-3 sentences. What likely caused it and what should the user check?`,
    ``,
    `Node: ${input.failedNode ?? "unknown"} (${input.nodeType ?? "unknown type"})`,
    `Error: ${input.errorMessage ?? "unknown error"}`,
  ].join("\n");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL ?? "https://flowmonix.com",
      "X-Title": "FlowMonix",
    },
    body: JSON.stringify({
      model: FREE_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 256,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return (json.choices?.[0]?.message?.content ?? "").trim();
}

// ─── Pro path — Claude Haiku ──────────────────────────────────────────────────

const PRO_MODEL = "claude-haiku-4-5-20251001";

async function callClaude(
  input: AiDebugInput,
): Promise<{ cause: string; fix_steps: string[]; prevention: string }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const inputContext =
    input.inputItems && input.inputItems.length > 0
      ? `\nInput to failed node (first item): ${JSON.stringify(input.inputItems[0]).slice(0, 500)}`
      : "";

  const prompt = [
    `You are an n8n workflow debugging assistant. Analyze this error and return a JSON object only — no prose, no markdown.`,
    ``,
    `Workflow: ${input.workflowName}`,
    `Failed node: ${input.failedNode ?? "unknown"} (type: ${input.nodeType ?? "unknown"})`,
    `Error type: ${input.errorType ?? "unknown"}`,
    `Error message: ${input.errorMessage ?? "unknown"}${inputContext}`,
    ``,
    `Return exactly this JSON shape:`,
    `{"cause":"one sentence root cause","fix_steps":["step 1","step 2"],"prevention":"one sentence prevention tip"}`,
  ].join("\n");

  const message = await client.messages.create({
    model: PRO_MODEL,
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  // Extract JSON — Haiku sometimes wraps in ```json
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Claude returned non-JSON: ${text}`);

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    cause: parsed.cause ?? "Unknown cause",
    fix_steps: Array.isArray(parsed.fix_steps) ? parsed.fix_steps : [],
    prevention: parsed.prevention ?? "",
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getAiDebug(
  input: AiDebugInput,
  tier: AiTier,
): Promise<AiDebugResult> {
  const signature = generateErrorSignature(
    input.workflowId,
    input.failedNode,
    input.errorMessage,
  );

  // Cache hit
  const cached = await getCached(signature, tier);
  if (cached) {
    logger.debug("AI cache hit", { category: "ai", tier, workflowId: input.workflowId, model: cached.model });
    return cached;
  }

  if (tier === "free") {
    const t0 = Date.now();
    const raw = await callOpenRouter(input);
    const latencyMs = Date.now() - t0;
    logger.info("OpenRouter AI call complete", { category: "ai", tier, model: FREE_MODEL, workflowId: input.workflowId, latencyMs });
    const result: Omit<AiDebugResult, "cached"> = {
      tier: "free",
      model: FREE_MODEL,
      raw_response: raw,
    };
    await storeResult(signature, result);
    return { ...result, cached: false };
  }

  // Pro
  const t0 = Date.now();
  const { cause, fix_steps, prevention } = await callClaude(input);
  const latencyMs = Date.now() - t0;
  logger.info("Claude AI call complete", { category: "ai", tier, model: PRO_MODEL, workflowId: input.workflowId, latencyMs });
  const raw = `${cause}\n\nFix:\n${fix_steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nPrevention: ${prevention}`;
  const result: Omit<AiDebugResult, "cached"> = {
    tier: "pro",
    model: PRO_MODEL,
    raw_response: raw,
    cause,
    fix_steps,
    prevention,
  };
  await storeResult(signature, result);
  return { ...result, cached: false };
}
