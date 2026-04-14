// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}

// ─── n8n Instance ────────────────────────────────────────────────────────────

export interface N8nInstance {
  id: string;
  org_id: string;
  name: string;
  url: string;
  api_key_hint: string; // last 4 chars only — never store full key in frontend
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
}

// ─── Workflow ─────────────────────────────────────────────────────────────────

export type WorkflowStatus = "active" | "inactive";

export interface Workflow {
  id: string;
  instance_id: string;
  n8n_id: string;
  name: string;
  status: WorkflowStatus;
  tags: string[];
  node_count: number;
  last_execution_at: string | null;
  last_execution_status: ExecutionStatus | null;
  executions_24h: number;
  failures_24h: number;
  success_rate: number; // 0–100
  avg_duration_ms: number;
  created_at: string;
  updated_at: string;
}

// ─── Execution ────────────────────────────────────────────────────────────────

export type ExecutionStatus = "success" | "error" | "running" | "waiting" | "canceled";

export interface Execution {
  id: string;
  instance_id: string;
  workflow_id: string;
  workflow_name: string;
  n8n_execution_id: string;
  status: ExecutionStatus;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  failed_node: string | null;
  error_message: string | null;
  error_type: string | null;
  mode: "manual" | "trigger" | "webhook" | "retry";
  data?: ExecutionData;
}

export interface ExecutionData {
  nodes: ExecutionNode[];
}

export interface ExecutionNode {
  name: string;
  type: string;
  status: "success" | "error" | "skipped";
  duration_ms: number;
  input_items?: unknown[];
  output_items?: unknown[];
  error?: string;
  error_description?: string;
}

// ─── Incident ─────────────────────────────────────────────────────────────────

export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "investigating" | "resolved";

export interface Incident {
  id: string;
  instance_id: string;
  workflow_id: string;
  workflow_name: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  failure_count: number;
  first_seen_at: string;
  last_seen_at: string;
  resolved_at: string | null;
  assigned_to: string | null;
  last_n8n_execution_id: string | null;
}

// ─── Alert ────────────────────────────────────────────────────────────────────

export interface Alert {
  id: string;
  instance_id: string;
  workflow_id: string | null;
  name: string;
  channel: "slack" | "email" | "webhook";
  destination: string;
  threshold_count: number;
  threshold_minutes: number;
  cooldown_minutes: number;
  is_active: boolean;
  created_at: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  total_workflows: number;
  active_workflows: number;
  executions_24h: number;
  failures_24h: number;
  success_rate: number;
  avg_duration_ms: number;
  open_incidents: number;
  executions_trend: TrendPoint[];
  failures_trend: TrendPoint[];
}

export interface TrendPoint {
  time: string;
  executions: number;
  failures: number;
}

// ─── Organizations ────────────────────────────────────────────────────────────

export type OrgRole = "owner" | "admin" | "viewer";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  invited_by: string | null;
  created_at: string;
}

export interface OrganizationInvite {
  id: string;
  org_id: string;
  email: string;
  role: OrgRole;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  invited_by: string;
  created_at: string;
}
