import { NextRequest, NextResponse } from "next/server";
import { generatePin, hashPin, pinExpiresAt } from "@/lib/pin";
import { sendPinEmail } from "@/lib/email";
import { getServerDb } from "@/lib/db";
import { logger } from "@/lib/logger";

const DEMO_EMAIL = "demo@flowwatch.app";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string = (body.email ?? "").toLowerCase().trim();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // Demo shortcut — no DB needed
    if (email === DEMO_EMAIL) {
      return NextResponse.json({ ok: true });
    }

    const db = getServerDb();

    // Basic rate limit: check for an unexpired PIN created in the last 60 seconds
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recent } = await db
      .from("pin_verifications")
      .select("id, created_at")
      .eq("email", email)
      .gt("expires_at", new Date().toISOString())
      .is("used_at", null)
      .gt("created_at", sixtySecondsAgo)
      .limit(1)
      .single();

    if (recent) {
      return NextResponse.json(
        { error: "A PIN was already sent recently. Please wait before requesting another." },
        { status: 429 }
      );
    }

    // Generate and hash PIN
    const pin = generatePin();
    const pinHash = await hashPin(pin);
    const expiresAt = pinExpiresAt();

    // Insert pin_verification row
    const { error: insertError } = await db.from("pin_verifications").insert({
      email,
      pin_hash: pinHash,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      logger.error("Failed to insert pin_verification", { category: "auth", email, err: insertError });
      return NextResponse.json({ error: "Failed to send PIN. Please try again." }, { status: 500 });
    }

    // Send email
    await sendPinEmail(email, pin);

    logger.info("PIN sent", { category: "auth", email });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("send-pin unhandled error", { category: "auth", err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
