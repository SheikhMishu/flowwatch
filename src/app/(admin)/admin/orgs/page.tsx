import { redirect } from "next/navigation";
import { TZDate } from "@date-fns/tz";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { OrgsClient } from "./orgs-client";

export const dynamic = "force-dynamic";

export default async function AdminOrgsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getServerDb();
  const { data: adminUser } = await db
    .from("users")
    .select("is_super_admin")
    .eq("id", session.userId)
    .single();

  if (!adminUser?.is_super_admin) redirect("/dashboard");

  const { data: orgs } = await db
    .from("organizations")
    .select("id, name, slug, plan, plan_status, created_at, stripe_subscription_id")
    .order("created_at", { ascending: false })
    .limit(10000);

  const orgIds = (orgs ?? []).map((o) => o.id);

  const MELB = "Australia/Melbourne";
  const nowMelb = new TZDate(new Date(), MELB);
  const currentMonth = `${nowMelb.getFullYear()}-${String(nowMelb.getMonth() + 1).padStart(2, "0")}-01`;

  const [{ data: memberCounts }, { data: instanceCounts }, { data: aiThisMonth }] =
    await Promise.all([
      db.from("organization_members").select("org_id").in("org_id", orgIds).limit(10000),
      db.from("n8n_instances").select("org_id, is_active").in("org_id", orgIds).limit(10000),
      db
        .from("ai_usage")
        .select("org_id, count")
        .in("org_id", orgIds)
        .eq("month", currentMonth),
    ]);

  const enriched = (orgs ?? []).map((org) => ({
    ...org,
    member_count: (memberCounts ?? []).filter((m) => m.org_id === org.id).length,
    instance_count: (instanceCounts ?? []).filter((i) => i.org_id === org.id).length,
    active_instances: (instanceCounts ?? []).filter(
      (i) => i.org_id === org.id && i.is_active
    ).length,
    ai_this_month: (aiThisMonth ?? []).find((a) => a.org_id === org.id)?.count ?? 0,
  }));

  return <OrgsClient orgs={enriched} />;
}
