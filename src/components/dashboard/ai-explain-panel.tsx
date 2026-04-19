"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiDebugResult } from "@/lib/ai-debug";

// ─── Props ────────────────────────────────────────────────────────────────────

interface AiExplainPanelProps {
  workflowId: string;
  workflowName?: string;
  failedNode?: string | null;
  errorMessage: string;
  errorType?: string | null;
  nodeType?: string | null;
  inputItems?: unknown[];
  className?: string;
}

// ─── Upgrade nudge ────────────────────────────────────────────────────────────

function UpgradeNudge() {
  return (
    <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground">Get structured fix steps</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pro users see root cause, numbered fix steps, and prevention tips — powered by Claude.
        </p>
      </div>
      <a
        href="/dashboard/billing"
        className="shrink-0 inline-flex items-center gap-1 rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap hover:opacity-90 transition-opacity"
      >
        Upgrade <ArrowRight className="w-3 h-3" />
      </a>
    </div>
  );
}

// ─── Result display ───────────────────────────────────────────────────────────

function AiResult({ result }: { result: AiDebugResult }) {
  if (result.tier === "free" || !result.cause) {
    // Unstructured free response
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground leading-relaxed">{result.raw_response}</p>
        <UpgradeNudge />
      </div>
    );
  }

  // Structured pro response
  return (
    <div className="space-y-4">
      {/* Cause */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          Cause
        </p>
        <p className="text-sm text-foreground leading-relaxed">{result.cause}</p>
      </div>

      {/* Fix steps */}
      {result.fix_steps && result.fix_steps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Fix Steps
          </p>
          <ol className="space-y-1.5">
            {result.fix_steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Prevention */}
      {result.prevention && (
        <div className="rounded-lg bg-muted px-3 py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
            Prevention
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{result.prevention}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AiExplainPanel({
  workflowId,
  workflowName,
  failedNode,
  errorMessage,
  errorType,
  nodeType,
  inputItems,
  className,
}: AiExplainPanelProps) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<AiDebugResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  async function handleExplain() {
    setState("loading");
    setErrorText(null);

    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          workflowName,
          failedNode,
          errorMessage,
          errorType,
          nodeType,
          inputItems: inputItems?.slice(0, 1), // send first item only
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.result) {
        setErrorText(data.error ?? "Analysis failed");
        setState("error");
        return;
      }

      setResult(data.result);
      setState("done");
    } catch {
      setErrorText("Network error — please try again");
      setState("error");
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Button row */}
      {state === "idle" && (
        <button
          onClick={handleExplain}
          className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Explain with AI
        </button>
      )}

      {/* Loading */}
      {state === "loading" && (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyzing error...
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div className="space-y-2">
          <p className="text-xs text-destructive">{errorText}</p>
          <button
            onClick={handleExplain}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Try again
          </button>
        </div>
      )}

      {/* Result */}
      {state === "done" && result && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-1.5 w-full text-left mb-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              AI Analysis
            </span>
            {result.cached && (
              <span className="text-xs text-muted-foreground/60">(cached)</span>
            )}
            <span className="flex-1" />
            {collapsed
              ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              : <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            }
          </button>

          {!collapsed && <AiResult result={result} />}
        </div>
      )}
    </div>
  );
}
