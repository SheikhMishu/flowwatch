"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface DemoTrackerProps {
  isDemo: boolean;
}

export function DemoTracker({ isDemo }: DemoTrackerProps) {
  const pathname = usePathname();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    if (!isDemo) return;
    if (pathname === lastTracked.current) return;
    lastTracked.current = pathname;

    fetch("/api/demo/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: pathname }),
    }).catch(() => {
      // silent — tracking failure must never affect the demo UX
    });
  }, [isDemo, pathname]);

  return null;
}
