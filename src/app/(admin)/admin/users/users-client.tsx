"use client";

import { useState, useMemo } from "react";
import { Shield, Search, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EnrichedUser } from "./page";

const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
] as const;

function getAvatarColor(email: string): string {
  return AVATAR_COLORS[email.charCodeAt(0) % AVATAR_COLORS.length];
}

function getInitials(name: string | null, email: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
  return email[0].toUpperCase();
}

const PLAN_BADGE: Record<string, string> = {
  free: "bg-gray-800 text-gray-400 border-gray-700",
  pro: "bg-indigo-900/50 text-indigo-300 border-indigo-700/50",
  team: "bg-violet-900/50 text-violet-300 border-violet-700/50",
};

interface UsersClientProps {
  users: EnrichedUser[];
}

export function UsersClient({ users }: UsersClientProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name ?? "").toLowerCase().includes(q)
    );
  }, [users, query]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 min-h-full">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All registered accounts across FlowMonix
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-muted-foreground w-fit">
          <Users className="w-3.5 h-3.5" />
          <span className="font-medium text-foreground">{users.length}</span>
          <span>total</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9 bg-card border-border text-sm"
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide w-8" />
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                User
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Organizations
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Role
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground text-sm"
                >
                  No users match your search.
                </td>
              </tr>
            )}
            {filtered.map((user) => {
              const initials = getInitials(user.name, user.email);
              const colorClass = getAvatarColor(user.email);

              return (
                <tr
                  key={user.id}
                  className="hover:bg-secondary/30 transition-colors"
                >
                  {/* Avatar */}
                  <td className="px-4 py-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold",
                        colorClass
                      )}
                    >
                      {initials}
                    </div>
                  </td>

                  {/* Name + Email */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">
                          {user.name ?? "—"}
                        </span>
                        {user.is_super_admin && (
                          <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs mt-0.5">
                        {user.email}
                      </span>
                    </div>
                  </td>

                  {/* Organizations */}
                  <td className="px-4 py-3">
                    {user.orgs.length === 0 ? (
                      <span className="text-muted-foreground text-xs">
                        No orgs
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {user.orgs.map((m) => (
                          <div
                            key={m.org_id}
                            className="flex items-center gap-1"
                          >
                            <span className="text-foreground text-xs font-medium">
                              {m.org?.name ?? m.org_id}
                            </span>
                            {m.org?.plan && (
                              <span
                                className={cn(
                                  "text-[10px] font-medium px-1.5 py-0.5 rounded border",
                                  PLAN_BADGE[m.org.plan] ??
                                    "bg-gray-800 text-gray-400 border-gray-700"
                                )}
                              >
                                {m.org.plan}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Role(s) */}
                  <td className="px-4 py-3">
                    {user.orgs.length === 0 ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {user.orgs.map((m) => (
                          <Badge
                            key={m.org_id}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 font-medium"
                          >
                            {m.role}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {formatDistanceToNow(new Date(user.created_at), {
                      addSuffix: true,
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {query && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {users.length} users
        </p>
      )}
    </div>
  );
}
