import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getServerDb } from "@/lib/db";
import { AdminLayoutClient } from "./admin-layout-client";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = getServerDb();
  const { data: adminUser } = await db
    .from("users")
    .select("is_super_admin")
    .eq("id", session.userId)
    .single();

  if (!adminUser?.is_super_admin) redirect("/dashboard");

  return (
    <AdminLayoutClient userEmail={session.email} userName={session.name}>
      {children}
    </AdminLayoutClient>
  );
}
