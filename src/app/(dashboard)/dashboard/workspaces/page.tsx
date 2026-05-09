import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { WorkspacesClient } from "./workspaces-client";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage() {
  const session = await getSession();
  if (!session || session.orgId === "org_demo") redirect("/dashboard");

  // Only owners can access this page
  const db = getServerDb();
  const { data: membership } = await db
    .from("organization_members")
    .select("role")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .single();

  if (!membership || membership.role !== "owner") redirect("/dashboard");

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Workspaces" />
      <div className="flex-1 p-4 md:p-6 animate-fade-in">
        <WorkspacesClient />
      </div>
    </div>
  );
}
