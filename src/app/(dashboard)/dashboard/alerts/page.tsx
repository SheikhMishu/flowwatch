import React from "react";
import { Header } from "@/components/layout/header";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { mockAlerts } from "@/lib/mock-data";
import { AlertsClient } from "./alerts-client";
import type { Alert } from "@/types";

async function getAlerts(orgId: string): Promise<Alert[]> {
  const db = getServerDb();
  const { data } = await db
    .from("alerts")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Alert[];
}

export default async function AlertsPage() {
  const session = await getSession();
  const isDemo = !session || session.orgId === "org_demo";
  const alerts: Alert[] = isDemo ? mockAlerts : await getAlerts(session.orgId);

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Alerts" />
      <AlertsClient initialAlerts={alerts} />
    </div>
  );
}
