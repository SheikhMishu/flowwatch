import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavProgress } from "@/components/layout/nav-progress";
import { OnboardingController } from "@/components/onboarding/onboarding-controller";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const userName = session.name ?? session.email ?? "";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <NavProgress />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
      <Suspense fallback={null}>
        <OnboardingController userName={userName} />
      </Suspense>
    </div>
  );
}
