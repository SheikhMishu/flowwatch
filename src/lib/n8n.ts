// n8n REST API v1 client + data transformers
// Docs: https://docs.n8n.io/api/

import type { Workflow, Execution, ExecutionNode, DashboardStats, TrendPoint } from "@/types";

// ─── Raw n8n API types ────────────────────────────────────────────────────────

export interface N8nWorkflowRaw {
  id: string;
  name: string;
  active: boolean;
  tags: { id: string; name: string }[];
  nodes: { id: string; name: string; type: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface N8nExecutionRaw {
  id: number;
  workflowId: string;
  workflowName?: string;
  finished: boolean;
  mode: "manual" | "trigger" | "webhook" | "retry" | "integrated" | "internal" | "error";
  startedAt: string;
  stoppedAt: string | null;
  status: "success" | "error" | "running" | "waiting" | "canceled" | "crashed" | "new";
}

interface N8nNodeRun {
  startTime: number;
  executionTime: number;
  error?: { message: string; name: string };
  data?: { main?: Array<Array<{ json: unknown }>> };
}

export interface N8nExecutionRawWithData extends N8nExecutionRaw {
  data?: {
    resultData?: {
      runData?: Record<string, N8nNodeRun[]>;
      error?: { message: string; name: string; node?: { name: string } };
    };
  };
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class N8nClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(instanceUrl: string, apiKey: string) {
    this.baseUrl = instanceUrl.replace(/\/+$/, "") + "/api/v1";
    this.apiKey = apiKey;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { "X-N8N-API-KEY": this.apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`n8n API ${res.status}: ${text}`);
    }
    return res.json();
  }

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.get<unknown>("/workflows?limit=1");
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Connection failed" };
    }
  }

  async getWorkflows(): Promise<N8nWorkflowRaw[]> {
    const data = await this.get<{ data: N8nWorkflowRaw[] }>("/workflows?limit=250");
    return data.data ?? [];
  }

  async getExecutions(opts?: { limit?: number; workflowId?: string }): Promise<N8nExecutionRaw[]> {
    const params = new URLSearchParams({
      limit: String(opts?.limit ?? 100),
      includeData: "false",
    });
    if (opts?.workflowId) params.set("workflowId", opts.workflowId);
    const data = await this.get<{ data: N8nExecutionRaw[] }>(`/executions?${params}`);
    return data.data ?? [];
  }

  async getWorkflowById(id: string): Promise<N8nWorkflowRaw> {
    return this.get<N8nWorkflowRaw>(`/workflows/${id}`);
  }

  async getExecutionWithData(id: string): Promise<N8nExecutionRawWithData> {
    return this.get<N8nExecutionRawWithData>(`/executions/${id}?includeData=true`);
  }

  async retryExecution(executionId: string): Promise<{ id: number }> {
    const res = await fetch(`${this.baseUrl}/executions/${executionId}/retry`, {
      method: "POST",
      headers: { "X-N8N-API-KEY": this.apiKey },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`n8n API ${res.status}: ${text}`);
    }
    return res.json();
  }
}

// ─── Transforms ───────────────────────────────────────────────────────────────

function normalizeMode(mode: string): Execution["mode"] {
  if (mode === "trigger" || mode === "webhook" || mode === "manual" || mode === "retry") return mode;
  return "trigger";
}

function normalizeStatus(status: string): Execution["status"] {
  if (status === "success" || status === "error" || status === "running" || status === "waiting" || status === "canceled") return status;
  return "error";
}

export function toWorkflow(w: N8nWorkflowRaw, instanceId: string): Workflow {
  return {
    id: `${instanceId}:${w.id}`,
    instance_id: instanceId,
    n8n_id: w.id,
    name: w.name,
    status: w.active ? "active" : "inactive",
    tags: (w.tags ?? []).map((t) => t.name),
    node_count: (w.nodes ?? []).length,
    last_execution_at: null,
    last_execution_status: null,
    executions_24h: 0,
    failures_24h: 0,
    success_rate: 100,
    avg_duration_ms: 0,
    created_at: w.createdAt,
    updated_at: w.updatedAt,
  };
}

export function toExecution(e: N8nExecutionRaw, instanceId: string, workflowName: string): Execution {
  const startedAt = e.startedAt;
  const finishedAt = e.stoppedAt;
  const durationMs =
    finishedAt ? new Date(finishedAt).getTime() - new Date(startedAt).getTime() : null;

  return {
    id: `${instanceId}:${e.id}`,
    instance_id: instanceId,
    workflow_id: `${instanceId}:${e.workflowId}`,
    workflow_name: e.workflowName ?? workflowName,
    n8n_execution_id: String(e.id),
    status: normalizeStatus(e.status),
    started_at: startedAt,
    finished_at: finishedAt,
    duration_ms: durationMs,
    failed_node: null,
    error_message: null,
    error_type: null,
    mode: normalizeMode(e.mode),
  };
}

// ─── Execution with node data transform ───────────────────────────────────────

export function toExecutionNodes(raw: N8nExecutionRawWithData): ExecutionNode[] {
  const runData = raw.data?.resultData?.runData;
  if (!runData) return [];
  return Object.entries(runData).map(([name, runs]) => {
    const run = runs[0];
    const hasError = !!run?.error;
    return {
      name,
      type: "",
      status: (hasError ? "error" : "success") as ExecutionNode["status"],
      duration_ms: run?.executionTime ?? 0,
      error: run?.error?.message,
      output: run?.data?.main?.[0]?.[0]?.json,
    };
  });
}

export function toExecutionFull(
  e: N8nExecutionRawWithData,
  instanceId: string,
  workflowName: string
): Execution {
  const base = toExecution(e, instanceId, workflowName);
  const nodes = toExecutionNodes(e);
  const topError = e.data?.resultData?.error;
  return {
    ...base,
    failed_node: topError?.node?.name ?? (nodes.find((n) => n.status === "error")?.name ?? null),
    error_message: topError?.message ?? null,
    error_type: topError?.name ?? null,
    data: nodes.length > 0 ? { nodes } : undefined,
  };
}

// ─── Stats computation ────────────────────────────────────────────────────────

export function computeStats(
  executions: N8nExecutionRaw[],
  workflows: N8nWorkflowRaw[]
): DashboardStats {
  const now = Date.now();
  const since24h = now - 24 * 60 * 60 * 1000;

  const recent = executions.filter((e) => new Date(e.startedAt).getTime() > since24h);
  const failures = recent.filter((e) => e.status === "error" || e.status === "crashed");

  const durations = recent
    .filter((e) => e.stoppedAt)
    .map((e) => new Date(e.stoppedAt!).getTime() - new Date(e.startedAt).getTime())
    .filter((d) => d >= 0);

  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

  const successRate =
    recent.length > 0
      ? Math.round(((recent.length - failures.length) / recent.length) * 1000) / 10
      : 100;

  // Hourly buckets for last 24h
  const trend: TrendPoint[] = Array.from({ length: 24 }, (_, i) => {
    const hourStart = now - (24 - i) * 3600000;
    const hourEnd = hourStart + 3600000;
    const inHour = recent.filter((e) => {
      const t = new Date(e.startedAt).getTime();
      return t >= hourStart && t < hourEnd;
    });
    return {
      time: new Date(hourStart).toISOString(),
      executions: inHour.length,
      failures: inHour.filter((e) => e.status === "error" || e.status === "crashed").length,
    };
  });

  return {
    total_workflows: workflows.length,
    active_workflows: workflows.filter((w) => w.active).length,
    executions_24h: recent.length,
    failures_24h: failures.length,
    success_rate: successRate,
    avg_duration_ms: avgDuration,
    open_incidents: 0,
    executions_trend: trend,
    failures_trend: trend,
  };
}

// ─── Per-workflow stats enrichment ───────────────────────────────────────────

export function enrichWorkflowsWithStats(
  workflows: Workflow[],
  executions: N8nExecutionRaw[],
  instanceId: string
): Workflow[] {
  const now = Date.now();
  const since24h = now - 24 * 60 * 60 * 1000;

  const recent = executions.filter((e) => new Date(e.startedAt).getTime() > since24h);

  return workflows.map((wf) => {
    const wfExecs = recent.filter((e) => `${instanceId}:${e.workflowId}` === wf.id);
    const failures = wfExecs.filter((e) => e.status === "error" || e.status === "crashed");
    const successRate =
      wfExecs.length > 0
        ? Math.round(((wfExecs.length - failures.length) / wfExecs.length) * 1000) / 10
        : 100;

    const durations = wfExecs
      .filter((e) => e.stoppedAt)
      .map((e) => new Date(e.stoppedAt!).getTime() - new Date(e.startedAt).getTime())
      .filter((d) => d >= 0);

    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

    const sorted = [...wfExecs].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    const latest = sorted[0];

    return {
      ...wf,
      executions_24h: wfExecs.length,
      failures_24h: failures.length,
      success_rate: successRate,
      avg_duration_ms: avgDuration,
      last_execution_at: latest ? latest.startedAt : null,
      last_execution_status: latest ? (normalizeStatus(latest.status) as Workflow["last_execution_status"]) : null,
    };
  });
}
