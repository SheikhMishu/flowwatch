"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WelcomeModal } from "./welcome-modal";
import { ProductTour } from "./product-tour";

type Phase = "idle" | "modal" | "tour";

export function OnboardingController({ userName }: { userName: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");

  // Only fires on mount — welcome param is only present on first login
  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      setPhase("modal");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleModalDismiss(connected: boolean) {
    router.replace("/dashboard");
    if (connected) router.refresh();
    setPhase("tour");
  }

  function handleTourDone() {
    setPhase("idle");
  }

  if (phase === "modal") {
    return <WelcomeModal userName={userName} onDismiss={handleModalDismiss} />;
  }
  if (phase === "tour") {
    return <ProductTour onDone={handleTourDone} />;
  }
  return null;
}
