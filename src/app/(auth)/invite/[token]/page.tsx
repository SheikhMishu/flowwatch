"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Zap, Users, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageState = "loading" | "invalid" | "ready" | "pin" | "verifying";

const PIN_LENGTH = 6;
const RESEND_SECONDS = 30;

interface InviteInfo {
  email: string;
  role: string;
  orgName: string;
}

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [inviteError, setInviteError] = useState("");
  const [invite, setInvite] = useState<InviteInfo | null>(null);

  // PIN state
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [pinError, setPinError] = useState("");
  const [pinShake, setPinShake] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_SECONDS);
  const [resendLoading, setResendLoading] = useState(false);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Validate invite on mount
  useEffect(() => {
    async function validateInvite() {
      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json();
        if (!res.ok) {
          setInviteError(data.error || "Invalid invitation");
          setPageState("invalid");
          return;
        }
        setInvite(data);
        setPageState("ready");
      } catch {
        setInviteError("Failed to load invitation. Please try again.");
        setPageState("invalid");
      }
    }
    validateInvite();
  }, [token]);

  // Resend countdown
  useEffect(() => {
    if (pageState !== "pin") return;
    setResendCountdown(RESEND_SECONDS);
    const interval = setInterval(() => {
      setResendCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [pageState]);

  // Auto-focus first PIN box
  useEffect(() => {
    if (pageState === "pin") {
      setTimeout(() => pinRefs.current[0]?.focus(), 50);
    }
  }, [pageState]);

  const handleAccept = async () => {
    if (!invite) return;
    setPageState("verifying");
    setPinError("");
    try {
      const res = await fetch("/api/auth/send-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: invite.email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setInviteError(data.error || "Failed to send verification code");
        setPageState("ready");
        return;
      }
      setPin(Array(PIN_LENGTH).fill(""));
      setPageState("pin");
    } catch {
      setInviteError("Something went wrong. Please try again.");
      setPageState("ready");
    }
  };

  const submitPin = useCallback(
    async (digits: string[]) => {
      const code = digits.join("");
      if (code.length !== PIN_LENGTH || !invite) return;
      setPageState("verifying");
      setPinError("");
      try {
        const res = await fetch("/api/auth/verify-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: invite.email, pin: code, inviteToken: token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setPinError(data.error || "Invalid code. Please try again.");
          setPinShake(true);
          setTimeout(() => setPinShake(false), 600);
          setPin(Array(PIN_LENGTH).fill(""));
          setPageState("pin");
          setTimeout(() => pinRefs.current[0]?.focus(), 50);
          return;
        }
        router.push(data.redirect ?? "/dashboard");
      } catch {
        setPinError("Something went wrong. Please try again.");
        setPageState("pin");
      }
    },
    [invite, token, router]
  );

  const handlePinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...pin];
      if (next[idx]) {
        next[idx] = "";
        setPin(next);
      } else if (idx > 0) {
        next[idx - 1] = "";
        setPin(next);
        pinRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      pinRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < PIN_LENGTH - 1) {
      pinRefs.current[idx + 1]?.focus();
    }
  };

  const handlePinInput = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;
    if (val.length > 1) {
      const digits = val.slice(0, PIN_LENGTH).split("");
      const next = [...pin];
      digits.forEach((d, i) => {
        if (idx + i < PIN_LENGTH) next[idx + i] = d;
      });
      setPin(next);
      const focusIdx = Math.min(idx + digits.length, PIN_LENGTH - 1);
      pinRefs.current[focusIdx]?.focus();
      if (next.every((d) => d !== "")) submitPin(next);
      return;
    }
    const next = [...pin];
    next[idx] = val[val.length - 1];
    setPin(next);
    if (idx < PIN_LENGTH - 1) pinRefs.current[idx + 1]?.focus();
    if (next.every((d) => d !== "")) submitPin(next);
  };

  const handlePinPaste = (e: React.ClipboardEvent<HTMLInputElement>, idx: number) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    const digits = pasted.slice(0, PIN_LENGTH).split("");
    const next = [...pin];
    digits.forEach((d, i) => {
      if (idx + i < PIN_LENGTH) next[idx + i] = d;
    });
    setPin(next);
    const focusIdx = Math.min(idx + digits.length, PIN_LENGTH - 1);
    pinRefs.current[focusIdx]?.focus();
    if (next.every((d) => d !== "")) submitPin(next);
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || resendLoading || !invite) return;
    setResendLoading(true);
    setPin(Array(PIN_LENGTH).fill(""));
    setPinError("");
    try {
      await fetch("/api/auth/send-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: invite.email }),
      });
      setResendCountdown(RESEND_SECONDS);
    } finally {
      setResendLoading(false);
      setTimeout(() => pinRefs.current[0]?.focus(), 50);
    }
  };

  const isVerifying = pageState === "verifying";

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">FlowWatch</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <p className="text-white/90 text-2xl font-semibold leading-snug">
              &ldquo;One platform for your entire team&rsquo;s n8n workflows.&rdquo;
            </p>
            <p className="text-white/60 text-sm">Monitor, debug, and collaborate — together</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "99.4%", label: "Avg success rate" },
              { value: "2.3k", label: "Executions monitored/day" },
              { value: "< 30s", label: "Time to diagnose" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-3">
                <div className="text-white font-bold text-lg">{stat.value}</div>
                <div className="text-white/60 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/5" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-foreground">FlowWatch</span>
          </div>

          {/* Loading */}
          {pageState === "loading" && (
            <div className="animate-fade-in flex flex-col items-center gap-4 py-8">
              <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Loading invitation&hellip;</p>
            </div>
          )}

          {/* Invalid */}
          {pageState === "invalid" && (
            <div className="animate-fade-in space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Invite unavailable</h1>
                <p className="text-sm text-muted-foreground mt-1">{inviteError}</p>
              </div>
              <Button variant="outline" onClick={() => router.push("/login")}>
                Go to login
              </Button>
            </div>
          )}

          {/* Ready — show invite info + accept button */}
          {pageState === "ready" && invite && (
            <div className="animate-fade-in space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">You&rsquo;re invited</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Join <span className="font-semibold text-foreground">{invite.orgName}</span> on FlowWatch
                  </p>
                </div>
              </div>

              {inviteError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {inviteError}
                </div>
              )}

              <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Invited email</span>
                  <span className="font-medium text-foreground">{invite.email}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary capitalize">
                    {invite.role}
                  </span>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleAccept}>
                <span className="flex items-center gap-2">
                  Accept invitation <ArrowRight className="w-4 h-4" />
                </span>
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                We&apos;ll send a verification code to <span className="font-medium text-foreground">{invite.email}</span>
              </p>
            </div>
          )}

          {/* Verifying (sending PIN) */}
          {pageState === "verifying" && (
            <div className="animate-fade-in flex flex-col items-center gap-4 py-8">
              <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Just a moment&hellip;</p>
            </div>
          )}

          {/* PIN entry */}
          {pageState === "pin" && invite && (
            <div className="animate-fade-in space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    We sent a code to <span className="font-medium text-foreground">{invite.email}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {pinError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                    {pinError}
                  </div>
                )}

                <div
                  className={cn(
                    "flex gap-2 justify-between",
                    pinShake && "animate-[shake_0.5s_ease-in-out]"
                  )}
                >
                  {pin.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { pinRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handlePinInput(e, idx)}
                      onKeyDown={(e) => handlePinKeyDown(e, idx)}
                      onPaste={(e) => handlePinPaste(e, idx)}
                      disabled={isVerifying}
                      className={cn(
                        "w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-background",
                        "outline-none transition-colors focus:ring-0",
                        pinError
                          ? "border-destructive focus:border-destructive"
                          : "border-border focus:border-primary",
                        isVerifying && "opacity-50 cursor-not-allowed"
                      )}
                    />
                  ))}
                </div>

                <Button
                  onClick={() => submitPin(pin)}
                  className="w-full"
                  size="lg"
                  disabled={isVerifying || pin.some((d) => !d)}
                >
                  {isVerifying ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying&hellip;
                    </span>
                  ) : (
                    "Verify & join workspace"
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {resendCountdown > 0 ? (
                    <>Resend in <span className="font-mono">{resendCountdown}s</span>&hellip;</>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading}
                      className="text-primary hover:underline disabled:opacity-50"
                    >
                      {resendLoading ? "Sending…" : "Resend code"}
                    </button>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
