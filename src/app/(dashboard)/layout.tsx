import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavProgress } from "@/components/layout/nav-progress";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    </div>
  );
}
