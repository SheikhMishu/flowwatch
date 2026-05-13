import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { sendSequenceEmail1 } from "@/lib/email";

const FB_PIXEL_ID = "907874938979099";

async function sendCapiEvent(
  eventId: string,
  hashedEmail: string,
  ip: string,
  userAgent: string,
) {
  const token = process.env.FACEBOOK_CAPI_TOKEN;
  if (!token) return;

  await fetch(`https://graph.facebook.com/v21.0/${FB_PIXEL_ID}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [{
        event_name: "CompleteRegistration",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: "https://flowmonix.com",
        user_data: {
          em: hashedEmail,
          client_ip_address: ip,
          client_user_agent: userAgent,
        },
      }],
      access_token: token,
    }),
  }).catch((err) => console.error("CAPI event failed", err));
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email: string = (body.email ?? "").trim().toLowerCase();
  const instances: string = (body.instances ?? "").trim();
  const agency: string = (body.agency ?? "").trim();
  const eventId = randomUUID();

  if (!email || !instances || !agency) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Supabase env vars missing on landing service");
    return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/signups`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      email,
      instances,
      agency,
      sequence_step: 1,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      utm_content: body.utm_content || null,
      utm_term: body.utm_term || null,
      fbclid: body.fbclid || null,
      referrer: body.referrer || null,
      landing_page: body.landing_page || null,
    }),
  });

  // 409 = duplicate email — treat as success so we don't leak whether an email exists
  if (!res.ok && res.status !== 409) {
    const text = await res.text();
    console.error("Supabase insert error", res.status, text);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  if (res.status !== 409) {
    const hashedEmail = createHash("sha256").update(email).digest("hex");
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const userAgent = req.headers.get("user-agent") ?? "";
    sendSequenceEmail1(email).catch((err) => console.error("Welcome email failed", err));
    sendCapiEvent(eventId, hashedEmail, ip, userAgent);
  }

  return NextResponse.json({ ok: true, event_id: eventId });
}
