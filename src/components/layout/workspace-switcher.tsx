"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronDown, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrgOption {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface WorkspaceSwitcherProps {
  currentOrgId: string;
  currentOrgName: string;
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ currentOrgId, currentOrgName, collapsed }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [loadingSwitch, setLoadingSwitch] = useState<string | null>(null);
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgLoading, setNewOrgLoading] = useState(false);
  const [newOrgError, setNewOrgError] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const fetchOrgs = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/orgs");
      if (!res.ok) return;
      const data = await res.json();
      setOrgs(data.orgs ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    if (open) fetchOrgs();
  }, [open, fetchOrgs]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowNewWorkspace(false);
        setNewOrgName("");
        setNewOrgError("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleSwitch(orgId: string) {
    if (orgId === currentOrgId || loadingSwitch) return;
    setLoadingSwitch(orgId);
    try {
      const res = await fetch("/api/auth/switch-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });
      if (res.ok) {
        window.location.href = "/dashboard";
      }
    } catch {
      setLoadingSwitch(null);
    }
  }

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setNewOrgLoading(true);
    setNewOrgError("");
    try {
      // Fetch current user info for the create-org endpoint
      const meRes = await fetch("/api/auth/me");
      const { user } = await meRes.json();
      if (!user) { setNewOrgError("Session expired. Please refresh."); setNewOrgLoading(false); return; }

      const res = await fetch("/api/auth/create-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId, email: user.email, orgName: newOrgName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setNewOrgError(data.error || "Failed to create workspace."); setNewOrgLoading(false); return; }
      window.location.href = data.redirect ?? "/dashboard";
    } catch {
      setNewOrgError("Something went wrong.");
      setNewOrgLoading(false);
    }
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setOpen((v) => !v)}
        title={currentOrgName}
        className="relative flex items-center justify-center w-full h-9 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
      >
        <Building2 className="w-4 h-4 shrink-0" />
        {open && (
          <div
            ref={ref as React.RefObject<HTMLDivElement>}
            className="absolute left-full top-0 ml-2 w-56 z-50 rounded-xl border border-border bg-popover shadow-lg p-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownContent
              orgs={orgs}
              currentOrgId={currentOrgId}
              loadingSwitch={loadingSwitch}
              showNewWorkspace={showNewWorkspace}
              newOrgName={newOrgName}
              newOrgError={newOrgError}
              newOrgLoading={newOrgLoading}
              onSwitch={handleSwitch}
              onShowNew={() => setShowNewWorkspace(true)}
              onNewOrgNameChange={setNewOrgName}
              onCreateWorkspace={handleCreateWorkspace}
            />
          </div>
        )}
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
          "hover:bg-secondary text-foreground",
          open && "bg-secondary"
        )}
      >
        <Building2 className="w-4 h-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-left">{currentOrgName}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-popover shadow-lg p-1.5">
          <DropdownContent
            orgs={orgs}
            currentOrgId={currentOrgId}
            loadingSwitch={loadingSwitch}
            showNewWorkspace={showNewWorkspace}
            newOrgName={newOrgName}
            newOrgError={newOrgError}
            newOrgLoading={newOrgLoading}
            onSwitch={handleSwitch}
            onShowNew={() => setShowNewWorkspace(true)}
            onNewOrgNameChange={setNewOrgName}
            onCreateWorkspace={handleCreateWorkspace}
          />
        </div>
      )}
    </div>
  );
}

function DropdownContent({
  orgs,
  currentOrgId,
  loadingSwitch,
  showNewWorkspace,
  newOrgName,
  newOrgError,
  newOrgLoading,
  onSwitch,
  onShowNew,
  onNewOrgNameChange,
  onCreateWorkspace,
}: {
  orgs: OrgOption[];
  currentOrgId: string;
  loadingSwitch: string | null;
  showNewWorkspace: boolean;
  newOrgName: string;
  newOrgError: string;
  newOrgLoading: boolean;
  onSwitch: (orgId: string) => void;
  onShowNew: () => void;
  onNewOrgNameChange: (v: string) => void;
  onCreateWorkspace: (e: React.FormEvent) => void;
}) {
  return (
    <>
      {orgs.length > 0 && (
        <div className="mb-1">
          {orgs.map((org) => {
            const isCurrent = org.id === currentOrgId;
            const isLoading = loadingSwitch === org.id;
            return (
              <button
                key={org.id}
                type="button"
                onClick={() => onSwitch(org.id)}
                disabled={isCurrent || loadingSwitch !== null}
                className={cn(
                  "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm text-left transition-colors",
                  isCurrent
                    ? "text-foreground font-medium cursor-default"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  "disabled:opacity-60"
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-primary" />
                ) : isCurrent ? (
                  <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                ) : (
                  <span className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="flex-1 truncate">{org.name}</span>
                {isCurrent && (
                  <span className="text-[10px] text-muted-foreground capitalize">{org.role}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="border-t border-border pt-1">
        {!showNewWorkspace ? (
          <button
            type="button"
            onClick={onShowNew}
            className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            New workspace
          </button>
        ) : (
          <form onSubmit={onCreateWorkspace} className="p-1.5 space-y-2">
            {newOrgError && (
              <p className="text-xs text-destructive">{newOrgError}</p>
            )}
            <input
              autoFocus
              type="text"
              placeholder="Workspace name"
              value={newOrgName}
              onChange={(e) => onNewOrgNameChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={newOrgLoading || !newOrgName.trim()}
              className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60 transition-opacity"
            >
              {newOrgLoading ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Creating…</>
              ) : (
                "Create workspace"
              )}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
