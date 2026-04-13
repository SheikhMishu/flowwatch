"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  Search,
  Tag,
  ArrowRight,
  Cpu,
  Clock,
  BarChart2,
  Activity,
} from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Workflow, WorkflowStatus } from "@/types";

interface WorkflowsClientProps {
  workflows: Workflow[];
}

type StatusFilter = "all" | WorkflowStatus;

function SuccessRateBadge({ rate }: { rate: number }) {
  const color =
    rate >= 99
      ? "text-success"
      : rate >= 95
      ? "text-warning"
      : "text-destructive";
  return <span className={cn("font-semibold tabular-nums", color)}>{rate.toFixed(1)}%</span>;
}

function WorkflowStatusBadge({ status }: { status: WorkflowStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
      Inactive
    </span>
  );
}

function LastRunCell({ at }: { at: string | null }) {
  if (!at) return <span className="text-muted-foreground text-xs">Never</span>;
  return (
    <span className="text-sm text-muted-foreground whitespace-nowrap">
      {formatDistanceToNow(parseISO(at), { addSuffix: true })}
    </span>
  );
}

export function WorkflowsClient({ workflows }: WorkflowsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    workflows.forEach((w) => w.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [workflows]);

  const filtered = useMemo(() => {
    return workflows.filter((w) => {
      const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || w.status === statusFilter;
      const matchesTag = !tagFilter || w.tags.includes(tagFilter);
      return matchesSearch && matchesStatus && matchesTag;
    });
  }, [workflows, search, statusFilter, tagFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search workflows…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card p-1 shadow-card self-start">
          {(["all", "active", "inactive"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors capitalize",
                statusFilter === s
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Tag filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                tagFilter === tag
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-border/80"
              )}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Table (desktop) / Cards (mobile) */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-card p-16 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Activity className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No workflows found</p>
          <p className="text-xs text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Tags
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Nodes
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Last Run
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Success %
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Avg Duration
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    24h Runs
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((wf) => (
                  <tr
                    key={wf.id}
                    className="group hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/workflows/${encodeURIComponent(wf.id)}`)}
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {wf.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <WorkflowStatusBadge status={wf.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {wf.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[11px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Cpu className="w-3.5 h-3.5" />
                        {wf.node_count}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <LastRunCell at={wf.last_execution_at} />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <SuccessRateBadge rate={wf.success_rate} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-muted-foreground tabular-nums">
                        {formatDuration(wf.avg_duration_ms)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="tabular-nums font-medium text-foreground">
                        {wf.executions_24h.toLocaleString()}
                      </span>
                      {wf.failures_24h > 0 && (
                        <span className="ml-1 text-xs text-destructive">
                          ({wf.failures_24h} fail)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => router.push(`/dashboard/workflows/${encodeURIComponent(wf.id)}`)}
                      >
                        View
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((wf) => (
              <div
                key={wf.id}
                className="rounded-xl border border-border bg-card shadow-card p-5 space-y-3 cursor-pointer"
                onClick={() => router.push(`/dashboard/workflows/${encodeURIComponent(wf.id)}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{wf.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {wf.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[11px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <WorkflowStatusBadge status={wf.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Cpu className="w-3.5 h-3.5 shrink-0" />
                    <span>{wf.node_count} nodes</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatDuration(wf.avg_duration_ms)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    <SuccessRateBadge rate={wf.success_rate} />
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="w-3.5 h-3.5 shrink-0" />
                    <span>{wf.executions_24h} runs</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    <LastRunCell at={wf.last_execution_at} />
                  </span>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/workflows/${encodeURIComponent(wf.id)}`); }}>
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground text-right">
        Showing {filtered.length} of {workflows.length} workflows
      </p>
    </div>
  );
}
