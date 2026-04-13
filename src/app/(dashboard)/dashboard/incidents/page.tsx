import React from "react";
import { Header } from "@/components/layout/header";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { mockIncidents } from "@/lib/mock-data";
import { IncidentsClient } from "./incidents-client";
import type { Incident } from "@/types";

async function getIncidents(orgId: string): Promise<Incident[]> {
  const db = getServerDb();
  const { data } = await db
    .from("incidents")
    .select("*")
    .eq("org_id", orgId)
    .order("last_seen_at", { ascending: false });
  return (data ?? []) as unknown as Incident[];
}

export default async function IncidentsPage() {
  const session = await getSession();
  const isDemo = !session || session.orgId === "org_demo";
  const incidents: Incident[] = isDemo ? mockIncidents : await getIncidents(session.orgId);

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Incidents" />
      <IncidentsClient initialIncidents={incidents} />
    </div>
  );
}
