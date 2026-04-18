import { NextRequest, NextResponse } from "next/server";
import { sendSequenceEmail1 } from "@/lib/email";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email: string = (body.email ?? "").trim().toLowerCase();
  const instances: string = (body.instances ?? "").trim();
  const agency: string = (body.agency ?? "").trim();

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
    body: JSON.stringify({ email, instances, agency, sequence_step: 1 }),
  });

  // 409 = duplicate email — treat as success so we don't leak whether an email exists
  if (!res.ok && res.status !== 409) {
    const text = await res.text();
    console.error("Supabase insert error", res.status, text);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  // Send welcome email (fire-and-forget — don't block the response)
  if (res.status !== 409) {
    sendSequenceEmail1(email).catch((err) => console.error("Welcome email failed", err));
  }

  return NextResponse.json({ ok: true });
}
