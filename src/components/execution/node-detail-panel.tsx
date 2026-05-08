"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { GraphNode } from "@/types";

interface NodeDetailPanelProps {
  node: GraphNode;
  onClose: () => void;
}

type Tab = "Output" | "Input" | "Error";

export function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  const hasError = node.status === "error";
  const [tab, setTab] = useState<Tab>(hasError ? "Error" : "Output");

  const tabs: Tab[] = hasError ? ["Output", "Input", "Error"] : ["Output", "Input"];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-80 md:w-96 bg-card border-l border-border flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{node.name}</p>
            <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{node.type}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-4 shrink-0">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px ${
                tab === t
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {tab === "Output" && <JsonDisplay label="output" items={node.output_items} />}
          {tab === "Input" && <JsonDisplay label="input" items={node.input_items} />}
          {tab === "Error" && hasError && (
            <div className="space-y-3">
              {node.error && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    Message
                  </p>
                  <pre className="text-xs font-mono text-red-400 bg-destructive/10 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
                    {node.error}
                  </pre>
                </div>
              )}
              {node.error_description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                    Details
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {node.error_description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status footer */}
        <div className="p-3 border-t border-border flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              node.status === "ran"
                ? "bg-success/10 text-success"
                : node.status === "error"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {node.status}
          </span>
          {node.duration_ms !== undefined && node.status !== "skipped" && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {node.duration_ms < 1000
                ? `${node.duration_ms}ms`
                : `${(node.duration_ms / 1000).toFixed(2)}s`}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

function JsonDisplay({ label, items }: { label: string; items: unknown[] | undefined }) {
  if (!items || items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No {label} data</p>
    );
  }
  const preview = items.slice(0, 5);
  const remaining = items.length - preview.length;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {items.length} item{items.length !== 1 ? "s" : ""}
        {remaining > 0 ? ` (showing first 5)` : ""}
      </p>
      <pre className="text-xs font-mono text-foreground bg-secondary rounded-lg p-3 overflow-auto whitespace-pre-wrap break-words leading-relaxed max-h-[360px]">
        {JSON.stringify(preview.length === 1 ? preview[0] : preview, null, 2)}
      </pre>
      {remaining > 0 && (
        <p className="text-xs text-muted-foreground">
          … {remaining} more item{remaining !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
