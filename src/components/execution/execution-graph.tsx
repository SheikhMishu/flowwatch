"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExecutionGraph, GraphNode } from "@/types";

const NODE_W = 210;
const NODE_H = 84;
const PAD = 72;

interface ExecutionGraphProps {
  graph: ExecutionGraph;
  onNodeSelect: (node: GraphNode | null) => void;
  selectedNode: GraphNode | null;
}

function formatDurationShort(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function ExecutionGraphView({ graph, onNodeSelect, selectedNode }: ExecutionGraphProps) {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  if (graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        No nodes to display
      </div>
    );
  }

  const xs = graph.nodes.map((n) => n.position[0]);
  const ys = graph.nodes.map((n) => n.position[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  const svgWidth = Math.max(520, maxX - minX + NODE_W + PAD * 2);
  const svgHeight = Math.max(180, maxY - minY + NODE_H + PAD * 2);

  // top-left of each node in SVG space
  const toSvg = (pos: [number, number]): [number, number] => [
    pos[0] - minX + PAD,
    pos[1] - minY + PAD,
  ];

  const posMap = new Map<string, [number, number]>();
  graph.nodes.forEach((n) => posMap.set(n.name, toSvg(n.position)));

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(2, Math.max(0.25, z - e.deltaY * 0.001)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  return (
    <div className="relative">
      <button
        onClick={() => setZoom(1)}
        className="absolute top-2 right-2 z-10 text-xs px-2 py-1 rounded border border-border bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}% · Reset
      </button>

      <div
        ref={containerRef}
        className="overflow-auto rounded-lg border border-border bg-zinc-950"
        style={{ maxHeight: 480 }}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            display: "inline-block",
            minWidth: svgWidth,
          }}
        >
          <svg width={svgWidth} height={svgHeight} style={{ display: "block" }}>
            {/* Edges */}
            {graph.edges.map((edge, i) => {
              const src = posMap.get(edge.from);
              const tgt = posMap.get(edge.to);
              if (!src || !tgt) return null;

              const x1 = src[0] + NODE_W;
              const y1 = src[1] + NODE_H / 2;
              const x2 = tgt[0];
              const y2 = tgt[1] + NODE_H / 2;
              const cp = Math.max(50, Math.abs(x2 - x1) * 0.45);
              const d = `M ${x1} ${y1} C ${x1 + cp} ${y1} ${x2 - cp} ${y2} ${x2} ${y2}`;

              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2 - 12;

              return (
                <g key={i}>
                  <path
                    d={d}
                    fill="none"
                    stroke={edge.taken ? "#6366f1" : "#52525b"}
                    strokeWidth={edge.taken ? 2 : 1.5}
                    strokeDasharray={edge.taken ? undefined : "5 4"}
                    opacity={edge.taken ? 0.9 : 0.35}
                  />
                  {edge.label && (
                    <text
                      x={midX}
                      y={midY}
                      textAnchor="middle"
                      fontSize={10}
                      fill="#71717a"
                      className="select-none pointer-events-none"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {graph.nodes.map((node) => {
              const pos = posMap.get(node.name);
              if (!pos) return null;
              const [x, y] = pos;
              const isSelected = selectedNode?.name === node.name;

              const borderColor =
                node.status === "error"
                  ? "#ef4444"
                  : isSelected
                    ? "#818cf8"
                    : node.status === "ran"
                      ? "#6366f1"
                      : "#3f3f46";

              const bgColor =
                node.status === "error"
                  ? "rgba(239,68,68,0.07)"
                  : node.status === "skipped"
                    ? "rgba(39,39,42,0.4)"
                    : "rgba(24,24,27,0.95)";

              const shadow =
                node.status === "error"
                  ? "0 0 10px rgba(239,68,68,0.25)"
                  : isSelected
                    ? "0 0 0 2px rgba(129,140,248,0.35)"
                    : undefined;

              const typeLabel = node.type.split(".").pop() ?? node.type;

              return (
                <foreignObject
                  key={node.name}
                  x={x}
                  y={y}
                  width={NODE_W}
                  height={NODE_H}
                >
                  <div
                    style={{
                      width: NODE_W,
                      height: NODE_H,
                      border: `1.5px solid ${borderColor}`,
                      borderRadius: 8,
                      background: bgColor,
                      opacity: node.status === "skipped" ? 0.5 : 1,
                      cursor: "pointer",
                      padding: "8px 12px",
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 3,
                      boxShadow: shadow,
                      userSelect: "none",
                    }}
                    onClick={() => onNodeSelect(isSelected ? null : node)}
                  >
                    {/* Name row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: node.status === "error" ? "#fca5a5" : "#f4f4f5",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                          lineHeight: 1.3,
                        }}
                      >
                        {node.name}
                      </span>
                      {node.duration_ms !== undefined && node.status !== "skipped" && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#71717a",
                            flexShrink: 0,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {formatDurationShort(node.duration_ms)}
                        </span>
                      )}
                    </div>

                    {/* Type label */}
                    <span
                      style={{
                        fontSize: 10,
                        color: "#71717a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontFamily: "monospace",
                        lineHeight: 1.2,
                      }}
                    >
                      {typeLabel}
                    </span>

                    {/* Status / error line */}
                    {node.status === "skipped" && (
                      <span style={{ fontSize: 10, color: "#52525b" }}>skipped</span>
                    )}
                    {node.error && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "#fca5a5",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          lineHeight: 1.2,
                        }}
                      >
                        {node.error}
                      </span>
                    )}
                  </div>
                </foreignObject>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
