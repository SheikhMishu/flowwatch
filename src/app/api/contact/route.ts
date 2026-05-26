import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendContactEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 5 messages per hour per user
    const rl = checkRateLimit(`contact:${session.userId}`, 5, 60 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "You've sent too many messages. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }

    const body = await req.json();
    const subject: string = (body.subject ?? "").trim();
    const message: string = (body.message ?? "").trim();

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: "Message is too long." }, { status: 400 });
    }

    await sendContactEmail({
      senderName: session.name,
      senderEmail: session.email,
      orgName: session.orgName,
      subject,
      message,
    });

    logger.info("Contact form submitted", { category: "api", orgId: session.orgId, userId: session.userId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("POST /api/contact unhandled error", { category: "api", err });
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }
}
