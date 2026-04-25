"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Activity,
  ArrowLeft,
  Shield,
  Eye,
  X,
} from "lucide-react";
import { FlowMonixMark } from "@/components/brand/mark";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview",      href: "/admin",         icon: LayoutDashboard },
  { label: "Organizations", href: "/admin/orgs",    icon: Building2 },
  { label: "Users",         href: "/admin/users",   icon: Users },
  { label: "Usage",         href: "/admin/usage",   icon: Activity },
  { label: "Visitors",      href: "/admin/visitors",icon: Eye },
];

interface AdminSidebarProps {
  userEmail: string;
  userName: string;
  onClose?: () => void;
}

export function AdminSidebar({ userEmail, userName, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col bg-gray-950 border-r border-gray-800 h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-800">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <FlowMonixMark className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-gray-100 font-semibold text-sm leading-none">
            FlowMonix
          </span>
          <span className="text-gray-500 text-[10px] font-medium mt-0.5 flex items-center gap-1">
            <Shield className="w-2.5 h-2.5" />
            Super Admin
          </span>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors md:hidden flex-shrink-0"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-600/30"
                  : "text-gray-400 hover:text-gray-100 hover:bg-gray-800/60 border border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  isActive ? "text-indigo-400" : "text-gray-500"
                )}
              />
              {item.label}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-2 border-t border-gray-800" />

        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-gray-800/40 border border-transparent transition-colors"
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0" />
          Back to App
        </Link>
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">
              {(userName || userEmail).charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-gray-300 text-xs font-medium truncate leading-none">
              {userName || "Admin"}
            </span>
            <span className="text-gray-600 text-[10px] truncate mt-0.5">
              {userEmail}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
