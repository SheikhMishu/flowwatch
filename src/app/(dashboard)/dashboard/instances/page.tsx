import { Header } from "@/components/layout/header";
import { InstancesClient } from "./instances-client";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { mockInstances } from "@/lib/mock-data";
import type { N8nInstance } from "@/types";

async function getInstances(orgId: string): Promise<N8nInstance[]> {
  try {
    const db = getServerDb();
    const { data } = await db
      .from("n8n_instances")
      .select("id, org_id, name, url, api_key_hint, is_active, last_synced_at, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: true });
    return (data ?? []) as N8nInstance[];
  } catch {
    return [];
  }
}

export default async function InstancesPage() {
  const session = await getSession();

  // Demo mode: use mock data
  const isDemo = session?.orgId === "org_demo";
  const instances = isDemo ? mockInstances : await getInstances(session?.orgId ?? "");

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Instances" />
      <InstancesClient initialInstances={instances} />
    </div>
  );
}
