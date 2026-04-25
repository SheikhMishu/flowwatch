"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";
import { FlowMonixMark } from "@/components/brand/mark";
import { cn } from "@/lib/utils";

export function AdminLayoutClient({
  userEmail,
  userName,
  children,
}: {
  userEmail: string;
  userName: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: slide-over on mobile, static in flex on desktop */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
          "md:relative md:z-auto md:flex-shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <AdminSidebar
          userEmail={userEmail}
          userName={userName}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex-shrink-0 h-14 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <FlowMonixMark className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold text-gray-100">FlowMonix</span>
            <span className="text-xs text-gray-500 font-medium">Admin</span>
          </div>

          {/* Spacer to balance hamburger */}
          <div className="w-9" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
