"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";
import { FlowMonixMark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Step = "email" | "pin" | "create-org";

const PIN_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function LoginPage() {
  const router = useRouter();

  // — State machine
  const [step, setStep] = useState<Step>("email");

  // — Email step
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // — PIN step
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState("");
  const [pinShake, setPinShake] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_SECONDS);
  const [resendLoading, setResendLoading] = useState(false);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  // — Create-org step
  const [orgName, setOrgName] = useState("");
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState("");
  const [verifiedUserId, setVerifiedUserId] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");

  // — Resend countdown
  useEffect(() => {
    if (step !== "pin") return;
    setResendCountdown(RESEND_SECONDS);
    const interval = setInterval(() => {
      setResendCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // — Auto-focus email input on mount
  const emailInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (step === "email") {
      setTimeout(() => emailInputRef.current?.focus(), 50);
    }
  }, [step]);

  // — Auto-focus first PIN box when entering PIN step
  useEffect(() => {
    if (step === "pin") {
      setTimeout(() => pinRefs.current[0]?.focus(), 50);
    }
  }, [step]);

  // ─── Step 1: Send PIN ──────────────────────────────────────────────────────
  const handleSendPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailLoading(true);
    setEmailError("");
    try {
      const res = await fetch("/api/auth/send-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error || "Failed to send code. Try again.");
        setEmailLoading(false);
        return;
      }
      setPin(Array(PIN_LENGTH).fill(""));
      setPinError("");
      setStep("pin");
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setEmailLoading(false);
    }
  };

  // ─── Step 2: Verify PIN ────────────────────────────────────────────────────
  const submitPin = useCallback(
    async (digits: string[]) => {
      const code = digits.join("");
      if (code.length !== PIN_LENGTH) return;
      setPinLoading(true);
      setPinError("");
      try {
        const res = await fetch("/api/auth/verify-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, pin: code }),
        });
        const data = await res.json();
        if (!res.ok) {
          setPinError(data.error || "Invalid code. Please try again.");
          setPinShake(true);
          setTimeout(() => setPinShake(false), 600);
          setPin(Array(PIN_LENGTH).fill(""));
          setTimeout(() => pinRefs.current[0]?.focus(), 50);
          setPinLoading(false);
          return;
        }
        if (data.redirect) {
          router.push(data.redirect);
        } else if (data.needsOrg) {
          setVerifiedUserId(data.userId ?? "");
          setVerifiedEmail(data.email ?? email);
          setStep("create-org");
        }
      } catch {
        setPinError("Something went wrong. Please try again.");
        setPinLoading(false);
      }
    },
    [email, router]
  );

  const handlePinKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
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

  const handlePinInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;
    // Handle paste of multiple digits
    if (val.length > 1) {
      const digits = val.slice(0, PIN_LENGTH).split("");
      const next = [...pin];
      digits.forEach((d, i) => {
        if (idx + i < PIN_LENGTH) next[idx + i] = d;
      });
      setPin(next);
      const focusIdx = Math.min(idx + digits.length, PIN_LENGTH - 1);
      pinRefs.current[focusIdx]?.focus();
      if (next.every((d) => d !== "")) {
        submitPin(next);
      }
      return;
    }
    const next = [...pin];
    next[idx] = val[val.length - 1];
    setPin(next);
    if (idx < PIN_LENGTH - 1) {
      pinRefs.current[idx + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      submitPin(next);
    }
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
    if (next.every((d) => d !== "")) {
      submitPin(next);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || resendLoading) return;
    setResendLoading(true);
    setPin(Array(PIN_LENGTH).fill(""));
    setPinError("");
    try {
      await fetch("/api/auth/send-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendCountdown(RESEND_SECONDS);
    } finally {
      setResendLoading(false);
      setTimeout(() => pinRefs.current[0]?.focus(), 50);
    }
  };

  // ─── Step 3: Create org ────────────────────────────────────────────────────
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setOrgLoading(true);
    setOrgError("");
    try {
      const res = await fetch("/api/auth/create-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: verifiedUserId,
          email: verifiedEmail,
          orgName: orgName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOrgError(data.error || "Failed to create workspace. Try again.");
        setOrgLoading(false);
        return;
      }
      router.push(data.redirect ?? "/dashboard");
    } catch {
      setOrgError("Something went wrong. Please try again.");
      setOrgLoading(false);
    }
  };

  // ─── Layout ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <FlowMonixMark className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              <span className="text-white">Flow</span>
              <span className="text-white/70">monix</span>
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <blockquote className="space-y-3">
            <p className="text-white/90 text-2xl font-semibold leading-snug">
              &ldquo;Know exactly what broke and how to fix it &mdash; in 30 seconds.&rdquo;
            </p>
            <footer className="text-white/60 text-sm">From production chaos to clarity</footer>
          </blockquote>

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
              <FlowMonixMark className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              <span className="text-foreground">Flow</span>
              <span style={{
                background: "linear-gradient(135deg, #818CF8, #A78BFA)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>monix</span>
            </span>
          </div>

          {/* ── Step: EMAIL ──────────────────────────────────────── */}
          {step === "email" && (
            <div key="email" className="animate-fade-in space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Welcome to FlowMonix</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email to sign in or create an account
                </p>
              </div>

              <form onSubmit={handleSendPin} className="space-y-4">
                {emailError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                    {emailError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 text-base"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={emailLoading || !email.trim()}
                >
                  {emailLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending code&hellip;
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Continue <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Demo hint */}
              <div className="bg-accent border border-primary/20 rounded-lg px-3 py-2.5 text-xs space-y-0.5">
                <p className="font-semibold text-accent-foreground">Try the demo</p>
                <p className="text-muted-foreground">
                  Use{" "}
                  <button
                    type="button"
                    onClick={() => setEmail("demo@flowwatch.app")}
                    className="font-mono text-primary hover:underline"
                  >
                    demo@flowwatch.app
                  </button>{" "}
                  to try without an account
                </p>
              </div>
            </div>
          )}

          {/* ── Step: PIN ────────────────────────────────────────── */}
          {step === "pin" && (
            <div key="pin" className="animate-fade-in space-y-6">
              {/* Back button */}
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setPinError("");
                  setPin(Array(PIN_LENGTH).fill(""));
                }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div>
                <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a 6-digit code to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                  {" "}
                  &mdash;{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setPinError("");
                      setPin(Array(PIN_LENGTH).fill(""));
                    }}
                    className="text-primary hover:underline"
                  >
                    Change
                  </button>
                </p>
              </div>

              <div className="space-y-4">
                {pinError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                    {pinError}
                  </div>
                )}

                {/* PIN boxes */}
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
                      disabled={pinLoading}
                      className={cn(
                        "w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-background",
                        "outline-none transition-colors focus:ring-0",
                        pinError
                          ? "border-destructive focus:border-destructive"
                          : "border-border focus:border-primary",
                        pinLoading && "opacity-50 cursor-not-allowed"
                      )}
                    />
                  ))}
                </div>

                <Button
                  onClick={() => submitPin(pin)}
                  className="w-full"
                  size="lg"
                  disabled={pinLoading || pin.some((d) => !d)}
                >
                  {pinLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying&hellip;
                    </span>
                  ) : (
                    "Verify code"
                  )}
                </Button>

                {/* Resend */}
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

              {/* Demo hint for demo email */}
              {email === "demo@flowwatch.app" && (
                <div className="bg-accent border border-primary/20 rounded-lg px-3 py-2.5 text-xs">
                  <p className="font-semibold text-accent-foreground">Demo PIN</p>
                  <p className="text-muted-foreground mt-0.5">
                    Use code{" "}
                    <button
                      type="button"
                      onClick={() => {
                        const digits = "123456".split("");
                        setPin(digits);
                        submitPin(digits);
                      }}
                      className="font-mono text-primary tracking-widest hover:underline"
                    >
                      123456
                    </button>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Step: CREATE-ORG ─────────────────────────────────── */}
          {step === "create-org" && (
            <div key="create-org" className="animate-fade-in space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Create your workspace</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Set up your organization to get started
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateOrg} className="space-y-4">
                {orgError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                    {orgError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="orgName">Organization name</Label>
                  <Input
                    id="orgName"
                    type="text"
                    placeholder="Acme Corp"
                    autoComplete="organization"
                    required
                    autoFocus
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="h-11 text-base"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={orgLoading || !orgName.trim()}
                >
                  {orgLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating workspace&hellip;
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create workspace <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              <p className="text-xs text-center text-muted-foreground">
                Signed in as{" "}
                <span className="font-medium text-foreground">{verifiedEmail}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
