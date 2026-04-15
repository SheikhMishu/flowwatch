"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "flowmonix_auto_refresh";
const INTERVAL_SECONDS = 300; // 5 minutes

function readStorage(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

export function useAutoRefresh() {
  const router = useRouter();

  // Start with true to avoid SSR/hydration mismatch — sync from localStorage after mount
  const [enabled, setEnabled] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(INTERVAL_SECONDS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const enabledRef = useRef(true);
  const secondsRef = useRef(INTERVAL_SECONDS);

  // Sync enabled state from localStorage after mount
  useEffect(() => {
    const stored = readStorage();
    setEnabled(stored);
    enabledRef.current = stored;
  }, []);

  const doRefresh = useCallback(() => {
    setIsRefreshing(true);
    router.refresh();
    secondsRef.current = INTERVAL_SECONDS;
    setSecondsLeft(INTERVAL_SECONDS);
    setTimeout(() => setIsRefreshing(false), 700);
  }, [router]);

  // Countdown tick
  useEffect(() => {
    const tick = setInterval(() => {
      if (!enabledRef.current) return;
      secondsRef.current -= 1;
      setSecondsLeft(secondsRef.current);
      if (secondsRef.current <= 0) {
        doRefresh();
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [doRefresh]);

  function toggle() {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {}
    if (next) {
      // Reset countdown when re-enabling
      secondsRef.current = INTERVAL_SECONDS;
      setSecondsLeft(INTERVAL_SECONDS);
    }
  }

  return { enabled, toggle, secondsLeft, isRefreshing };
}
