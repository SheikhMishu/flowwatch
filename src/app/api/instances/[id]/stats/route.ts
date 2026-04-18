import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";

const DEMO_STATS: Record<string, { workflowCount: number; executionsToday: number; successRate: number }> = {
  inst_01: { workflowCount: 12, executionsToday: 47, successRate: 89 },
  inst_02: { workflowCount: 8, executionsToday: 12, successRate: 75 },
};

// GET /api/instances/[id]/stats
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (session.orgId === "org_demo") {
    const stats = DEMO_STATS[id] ?? { workflowCount: 0, executionsToday: 0, successRate: 0 };
    return NextResponse.json(stats);
  }

  const db = getServerDb();

  const { data: instance } = await db
    .from("n8n_instances")
    .select("id")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .single();

  if (!instance) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [{ count: workflowCount }, { data: execRows }] = await Promise.all([
    db
      .from("workflow_snapshots")
      .select("id", { count: "exact", head: true })
      .eq("instance_id", id),
    db
      .from("synced_executions")
      .select("status")
      .eq("instance_id", id)
      .gte("started_at", todayStart.toISOString()),
  ]);

  const executionsToday = execRows?.length ?? 0;
  const successToday = execRows?.filter((e) => e.status === "success").length ?? 0;
  const successRate = executionsToday > 0 ? Math.round((successToday / executionsToday) * 100) : 0;

  return NextResponse.json({
    workflowCount: workflowCount ?? 0,
    executionsToday,
    successRate,
  });
}
