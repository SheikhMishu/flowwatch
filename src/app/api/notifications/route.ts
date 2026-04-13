import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { N8nClient } from "@/lib/n8n";
import { mockExecutions } from "@/lib/mock-data";

export interface AppNotification {
  id: string;
  workflow_name: string;
  instance_name: string;
  instance_id: string;
  error_message: string | null;
  started_at: string;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Demo — derive from mock executions
  if (session.orgId === "org_demo") {
    const notifications: AppNotification[] = mockExecutions
      .filter((e) => e.status === "error")
      .slice(0, 10)
      .map((e) => ({
        id: e.id,
        workflow_name: e.workflow_name,
        instance_name: "Demo Instance",
        instance_id: e.instance_id,
        error_message: e.error_message ?? null,
        started_at: e.started_at,
      }));
    return NextResponse.json({ notifications });
  }

  const db = getServerDb();
  const { data: instances } = await db
    .from("n8n_instances")
    .select("id, name, url, api_key_encrypted")
    .eq("org_id", session.orgId)
    .eq("is_active", true);

  if (!instances || instances.length === 0) {
    return NextResponse.json({ notifications: [] });
  }

  const notifications: AppNotification[] = [];

  await Promise.all(
    instances.map(async (inst) => {
      try {
        const apiKey = decrypt(inst.api_key_encrypted);
        const client = new N8nClient(inst.url, apiKey);
        const [executions, workflows] = await Promise.all([
          client.getExecutions({ limit: 50 }),
          client.getWorkflows(),
        ]);
        const nameMap = Object.fromEntries(workflows.map((w) => [w.id, w.name]));
        for (const e of executions) {
          if (e.status === "error" || e.status === "crashed") {
            notifications.push({
              id: `${inst.id}:${e.id}`,
              workflow_name: nameMap[e.workflowId] ?? e.workflowName ?? "Unknown Workflow",
              instance_name: inst.name,
              instance_id: inst.id,
              error_message: null,
              started_at: e.startedAt,
            });
          }
        }
      } catch {
        // Instance unreachable — skip
      }
    })
  );

  // Sort newest first, cap at 20
  notifications.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  return NextResponse.json({ notifications: notifications.slice(0, 20) });
}
