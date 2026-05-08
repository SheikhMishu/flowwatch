"use client";

import { useState } from "react";
import Link from "next/link";
import { GitBranch, Lock, AlertCircle } from "lucide-react";
import type { ExecutionGraph, GraphNode } from "@/types";
import { ExecutionGraphView } from "./execution-graph";
import { NodeDetailPanel } from "./node-detail-panel";

interface ExecutionFlowSectionProps {
  graph: ExecutionGraph | undefined;
  isPro: boolean;
}

export function ExecutionFlowSection({ graph, isPro }: ExecutionFlowSectionProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  if (!isPro) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-slide-in">
        <div className="p-5 flex items-center justify-between gap-3 border-b border-border">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Execution Flow</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              Pro
            </span>
          </div>
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <GitBranch className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Execution Intelligence</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Visualise exactly which nodes ran, which branches were taken, and where your workflow broke — with per-node input and output data.
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  if (!graph) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card p-5 animate-slide-in">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Execution Flow</h2>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary border border-border">
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Graph data unavailable</p>
            <p className="text-xs text-muted-foreground mt-1">
              Enable{" "}
              <span className="font-mono">Save execution data</span> in your n8n workflow settings to capture execution flow.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-card p-5 space-y-4 animate-slide-in">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Execution Flow</h2>
          <span className="text-xs text-muted-foreground ml-auto">
            {graph.nodes.length} node{graph.nodes.length !== 1 ? "s" : ""} ·{" "}
            {graph.edges.length} edge{graph.edges.length !== 1 ? "s" : ""}
          </span>
        </div>
        <ExecutionGraphView
          graph={graph}
          onNodeSelect={setSelectedNode}
          selectedNode={selectedNode}
        />
        <p className="text-xs text-muted-foreground">
          Scroll to pan · Mouse wheel to zoom · Click a node to inspect data
        </p>
      </div>

      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </>
  );
}
