"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { distanceMelb } from "@/lib/dates";
import {
  Search,
  Building2,
  CheckCircle2,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EnrichedOrg {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "team";
  plan_status: string;
  created_at: string;
  stripe_subscription_id: string | null;
  member_count: number;
  instance_count: number;
  active_instances: number;
  ai_this_month: number;
}

interface OrgsClientProps {
  orgs: EnrichedOrg[];
}

function planBadgeClass(plan: string) {
  switch (plan) {
    case "pro":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "team":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    default:
      return "bg-secondary text-muted-foreground border-border";
  }
}

function planStatusBadgeVariant(status: string) {
  switch (status) {
    case "active":
      return "success";
    case "trialing":
      return "default";
    case "past_due":
      return "warning";
    case "canceled":
    case "canceling":
      return "destructive";
    default:
      return "secondary";
  }
}

export function OrgsClient({ orgs }: OrgsClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return orgs;
    return orgs.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.slug.toLowerCase().includes(q) ||
        o.plan.toLowerCase().includes(q)
    );
  }, [orgs, query]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/15 border border-indigo-600/30 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4.5 h-4.5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Organizations</h1>
            <p className="text-xs text-muted-foreground">
              {orgs.length} total{filtered.length !== orgs.length && `, ${filtered.length} shown`}
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search name, slug, plan…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-8 text-sm w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Organization
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Plan
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">
                Members
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">
                Instances
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">
                AI / mo
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Created
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">
                Stripe
              </th>
              <th className="px-2 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  No organizations match your search.
                </td>
              </tr>
            )}
            {filtered.map((org) => (
              <tr
                key={org.id}
                onClick={() => router.push(`/admin/orgs/${org.id}`)}
                className="hover:bg-secondary/30 cursor-pointer transition-colors group"
              >
                {/* Name + slug */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-border flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-foreground">
                        {org.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground leading-none truncate">
                        {org.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {org.slug}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Plan */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                        planBadgeClass(org.plan)
                      )}
                    >
                      {org.plan}
                    </span>
                    {org.plan_status && org.plan_status !== "active" && (
                      <Badge variant={planStatusBadgeVariant(org.plan_status) as Parameters<typeof Badge>[0]["variant"]}>
                        {org.plan_status.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                </td>

                {/* Members */}
                <td className="px-4 py-3 text-center">
                  <span className="tabular-nums text-foreground font-medium">
                    {org.member_count}
                  </span>
                </td>

                {/* Instances active/total */}
                <td className="px-4 py-3 text-center">
                  <span className="tabular-nums text-foreground">
                    <span className="font-medium text-emerald-500">{org.active_instances}</span>
                    <span className="text-muted-foreground">/{org.instance_count}</span>
                  </span>
                </td>

                {/* AI calls */}
                <td className="px-4 py-3 text-center">
                  <span className="tabular-nums text-foreground font-medium">
                    {org.ai_this_month.toLocaleString()}
                  </span>
                </td>

                {/* Created */}
                <td className="px-4 py-3">
                  <span className="text-muted-foreground text-xs">
                    {distanceMelb(org.created_at)}
                  </span>
                </td>

                {/* Stripe */}
                <td className="px-4 py-3 text-center">
                  {org.stripe_subscription_id ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                  )}
                </td>

                {/* Arrow */}
                <td className="px-2 py-3">
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
