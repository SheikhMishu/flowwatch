"use client";

import React, { useState } from "react";
import { RotateCcw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type RetryState = "idle" | "loading" | "success" | "error";

interface RetryButtonProps {
  /** Composite execution ID: "instanceId:n8nExecutionId" */
  executionId: string;
  /** Optional extra class names */
  className?: string;
  /** "default" = outlined button, "sm" = compact inline button */
  variant?: "default" | "sm";
}

export function RetryButton({ executionId, className, variant = "default" }: RetryButtonProps) {
  const [state, setState] = useState<RetryState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleRetry() {
    setState("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/executions/${encodeURIComponent(executionId)}/retry`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Retry failed");
        setState("error");
      } else {
        setState("success");
        // Reset back to idle after 3s
        setTimeout(() => setState("idle"), 3000);
      }
    } catch {
      setErrorMsg("Network error");
      setState("error");
    }
  }

  if (variant === "sm") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <button
          onClick={handleRetry}
          disabled={state === "loading" || state === "success"}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors border",
            state === "idle"     && "border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-secondary",
            state === "loading"  && "border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed",
            state === "success"  && "border-success/20 bg-success/10 text-success cursor-default",
            state === "error"    && "border-destructive/20 bg-destructive/10 text-destructive",
          )}
        >
          {state === "loading" && <Loader2 className="w-3 h-3 animate-spin" />}
          {state === "success" && <CheckCircle2 className="w-3 h-3" />}
          {state === "error"   && <XCircle className="w-3 h-3" />}
          {state === "idle"    && <RotateCcw className="w-3 h-3" />}
          {state === "loading" ? "Retrying…" : state === "success" ? "Retried" : state === "error" ? "Failed" : "Retry"}
        </button>
        {state === "error" && errorMsg && (
          <span className="text-xs text-destructive">{errorMsg}</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <button
        onClick={handleRetry}
        disabled={state === "loading" || state === "success"}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors border",
          state === "idle"    && "border-border bg-card text-foreground hover:bg-secondary",
          state === "loading" && "border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed",
          state === "success" && "border-success/20 bg-success/10 text-success cursor-default",
          state === "error"   && "border-destructive/20 bg-destructive/10 text-destructive",
        )}
      >
        {state === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
        {state === "success" && <CheckCircle2 className="w-4 h-4" />}
        {state === "error"   && <XCircle className="w-4 h-4" />}
        {state === "idle"    && <RotateCcw className="w-4 h-4" />}
        {state === "loading" ? "Retrying…" : state === "success" ? "Retried successfully" : state === "error" ? "Retry failed" : "Retry execution"}
      </button>
      {state === "error" && errorMsg && (
        <p className="text-xs text-destructive">{errorMsg}</p>
      )}
    </div>
  );
}
