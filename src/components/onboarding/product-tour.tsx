"use client";

import React, { useEffect, useState, useCallback } from "react";
import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  target: string;
  title: string;
  description: string;
  side: "right" | "bottom" | "left" | "top";
}

const STEPS: TourStep[] = [
  {
    target: "nav",
    title: "Your navigation",
    description:
      "Switch between Dashboard, Workflows, Executions, Incidents, and Alerts from here.",
    side: "right",
  },
  {
    target: "incidents-nav",
    title: "Incidents",
    description:
      "Auto-created when workflows fail repeatedly. This badge counts how many need your attention.",
    side: "right",
  },
  {
    target: "alerts-nav",
    title: "Alerts",
    description:
      "Set rules to get notified by email or Slack when workflows fail. Create your first one once you're connected.",
    side: "right",
  },
  {
    target: "instance-selector",
    title: "Instance selector",
    description:
      "Filter all data by a specific n8n instance, or view everything at once across all instances.",
    side: "bottom",
  },
  {
    target: "notifications",
    title: "Notifications",
    description:
      "Live feed of recent workflow failures — no setup needed. Always in sync with your n8n instance.",
    side: "bottom",
  },
];

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TOOLTIP_WIDTH = 280;
const GAP = 14;
const PAD = 6; // padding around target

function tooltipPosition(rect: TargetRect, side: TourStep["side"]) {
  const r = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };
  switch (side) {
    case "right":
      return {
        top: r.top + r.height / 2,
        left: r.left + r.width + GAP,
        transform: "translateY(-50%)",
      };
    case "bottom": {
      const left = Math.max(
        8,
        Math.min(r.left + r.width / 2 - TOOLTIP_WIDTH / 2, window.innerWidth - TOOLTIP_WIDTH - 8)
      );
      return { top: r.top + r.height + GAP, left, transform: "none" };
    }
    case "left":
      return {
        top: r.top + r.height / 2,
        left: r.left - TOOLTIP_WIDTH - GAP,
        transform: "translateY(-50%)",
      };
    case "top":
      return {
        top: r.top - GAP - 130,
        left: Math.max(8, r.left + r.width / 2 - TOOLTIP_WIDTH / 2),
        transform: "none",
      };
  }
}

export function ProductTour({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<TargetRect | null>(null);

  const measureStep = useCallback((stepIndex: number) => {
    const target = STEPS[stepIndex]?.target;
    if (!target) return;
    const el = document.querySelector(`[data-tour="${target}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, []);

  useEffect(() => {
    measureStep(step);
  }, [step, measureStep]);

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      onDone();
    }
  }

  function prev() {
    if (step > 0) setStep((s) => s - 1);
  }

  if (!rect) return null;

  const current = STEPS[step];
  const pos = tooltipPosition(rect, current.side);

  // The highlight ring uses a large box-shadow to dim everything around it.
  // This avoids z-index stacking context issues entirely — the ring's shadow
  // IS the overlay; the area inside the ring stays naturally bright.
  const highlightStyle: React.CSSProperties = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
    boxShadow: [
      "0 0 0 9999px rgba(0,0,0,0.55)", // full-screen dim via shadow
      "0 0 0 2px #818CF8",              // indigo ring
      "0 0 0 5px rgba(129,140,248,0.2)",// soft outer glow
      "0 0 20px rgba(129,140,248,0.3)", // ambient glow
    ].join(", "),
    transition: "top 0.22s cubic-bezier(0.4,0,0.2,1), left 0.22s cubic-bezier(0.4,0,0.2,1), width 0.22s cubic-bezier(0.4,0,0.2,1), height 0.22s cubic-bezier(0.4,0,0.2,1)",
  };

  return (
    <>
      {/* Click catcher — sits behind the ring, skips tour on click */}
      <div
        className="fixed inset-0 z-[60]"
        onClick={onDone}
      />

      {/* Highlight ring — creates the dim effect via box-shadow */}
      <div
        className="fixed z-[61] rounded-xl pointer-events-none"
        style={highlightStyle}
      />

      {/* Tooltip card */}
      <div
        className="fixed z-[62] rounded-xl border border-border bg-card shadow-elevated p-4"
        style={{
          width: TOOLTIP_WIDTH,
          top: pos.top,
          left: pos.left,
          transform: pos.transform,
          animation: "tourIn 0.2s cubic-bezier(0.16,1,0.3,1) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step dots + close */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="block rounded-full transition-all duration-200"
                style={{
                  width: i === step ? 16 : 6,
                  height: 6,
                  background: i === step ? "#818CF8" : "var(--border)",
                }}
              />
            ))}
          </div>
          <button
            onClick={onDone}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Skip tour"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="text-sm font-semibold text-foreground mb-1">
          {current.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          {current.description}
        </p>

        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            disabled={step === 0}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-0"
          >
            ← Back
          </button>
          <Button size="sm" onClick={next} className="gap-1.5 h-7 text-xs px-3">
            {step === STEPS.length - 1 ? "Done" : "Next"}
            {step < STEPS.length - 1 && <ArrowRight className="w-3 h-3" />}
          </Button>
        </div>
      </div>
    </>
  );
}
