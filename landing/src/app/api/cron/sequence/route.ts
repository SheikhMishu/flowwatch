// GET /api/cron/sequence
// Called daily by cron-job.org. Sends follow-up emails based on signup age.
//
// Sequence:
//   step 1 → welcome already sent on signup
//   step 1 + 2+ days  → send email 2 (educate pain), set step 2
//   step 2 + 4+ days  → send email 3 (value loop),   set step 3
//   step 3 + 7+ days  → send email 4 (nudge),        set step 4
//
// Required env: CRON_SECRET, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Plus SES vars: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, REG_MAIL_FROM

import { NextRequest, NextResponse } from "next/server";
import {
  sendSequenceEmail2,
  sendSequenceEmail3,
  sendSequenceEmail4,
} from "@/lib/email";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

async function fetchSignups(step: number, olderThanDays: number) {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/signups?sequence_step=eq.${step}&created_at=lte.${cutoff}&select=id,email`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  if (!res.ok) return [];
  return res.json() as Promise<{ id: string; email: string }[]>;
}

async function markStep(id: string, step: number) {
  await fetch(`${SUPABASE_URL}/rest/v1/signups?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ sequence_step: step }),
  });
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  const results = { email2: 0, email3: 0, email4: 0, errors: 0 };

  // Email 2: step=1 and signed up 2+ days ago
  const batch2 = await fetchSignups(1, 2);
  for (const row of batch2) {
    try {
      await sendSequenceEmail2(row.email);
      await markStep(row.id, 2);
      results.email2++;
    } catch (err) {
      console.error("sequence email2 failed", row.email, err);
      results.errors++;
    }
  }

  // Email 3: step=2 and signed up 4+ days ago
  const batch3 = await fetchSignups(2, 4);
  for (const row of batch3) {
    try {
      await sendSequenceEmail3(row.email);
      await markStep(row.id, 3);
      results.email3++;
    } catch (err) {
      console.error("sequence email3 failed", row.email, err);
      results.errors++;
    }
  }

  // Email 4: step=3 and signed up 7+ days ago
  const batch4 = await fetchSignups(3, 7);
  for (const row of batch4) {
    try {
      await sendSequenceEmail4(row.email);
      await markStep(row.id, 4);
      results.email4++;
    } catch (err) {
      console.error("sequence email4 failed", row.email, err);
      results.errors++;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
