/**
 * Stripe server-side client — lazy singleton.
 * Only call getStripe() inside request handlers (not at module init time),
 * so the build phase doesn't require STRIPE_SECRET_KEY to be set.
 */

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

/** Map plan ID → Stripe Price ID (set via env vars) */
export const STRIPE_PRICE_IDS: Record<string, string> = {
  pro: process.env.STRIPE_PRO_PRICE_ID ?? "",
  team: process.env.STRIPE_TEAM_PRICE_ID ?? "",
};

/** Map Stripe Price ID → plan ID (reverse lookup for webhooks) */
export function planFromPriceId(priceId: string): string | null {
  for (const [plan, pid] of Object.entries(STRIPE_PRICE_IDS)) {
    if (pid && pid === priceId) return plan;
  }
  return null;
}
