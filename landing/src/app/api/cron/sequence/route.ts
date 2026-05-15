// GET /api/cron/sequence
// Called daily by cron-job.org. Sends follow-up emails based on signup age.
//
// Sequence:
//   step 1 → welcome already sent on signup
//   step 1 + 2+ days  → send email 2 (educate pain), set step 2
//   step 2 + 4+ days  → send email 3 (value loop),   set step 3
//   step 3 + 7+ days  → send email 4 (nudge),        set step 4
//
// Users who have already connected an n8n instance are skipped and moved to step 4.
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

const supabaseHeaders = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
});

async function fetchSignups(step: number, olderThanDays: number): Promise<{ id: string; email: string }[]> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/signups?sequence_step=eq.${step}&created_at=lte.${cutoff}&select=id,email`,
    { headers: supabaseHeaders() }
  );
  if (!res.ok) return [];
  return res.json() as Promise<{ id: string; email: string }[]>;
}

// Returns emails from the given list that have already connected at least one n8n instance.
// Chain: email → users → organization_members → n8n_instances
async function getActivatedEmails(emails: string[]): Promise<Set<string>> {
  if (emails.length === 0) return new Set();

  const emailList = emails.join(",");

  // Step 1: find users with these emails
  const usersRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?select=id,email&email=in.(${emailList})`,
    { headers: supabaseHeaders() }
  );
  if (!usersRes.ok) return new Set();
  const users = (await usersRes.json()) as { id: string; email: string }[];
  if (users.length === 0) return new Set();

  // Step 2: find org memberships for those users
  const userIds = users.map((u) => u.id).join(",");
  const membersRes = await fetch(
    `${SUPABASE_URL}/rest/v1/organization_members?select=user_id,org_id&user_id=in.(${userIds})`,
    { headers: supabaseHeaders() }
  );
  if (!membersRes.ok) return new Set();
  const members = (await membersRes.json()) as { user_id: string; org_id: string }[];
  if (members.length === 0) return new Set();

  // Step 3: find which of those orgs have at least one n8n instance
  const orgIds = [...new Set(members.map((m) => m.org_id))].join(",");
  const instancesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/n8n_instances?select=org_id&org_id=in.(${orgIds})`,
    { headers: supabaseHeaders() }
  );
  if (!instancesRes.ok) return new Set();
  const instances = (await instancesRes.json()) as { org_id: string }[];

  // Map activated org_ids → user_ids → emails
  const activeOrgIds = new Set(instances.map((i) => i.org_id));
  const activeUserIds = new Set(
    members.filter((m) => activeOrgIds.has(m.org_id)).map((m) => m.user_id)
  );
  const activated = new Set<string>();
  users
    .filter((u) => activeUserIds.has(u.id))
    .forEach((u) => activated.add(u.email));

  return activated;
}

async function markStep(id: string, step: number) {
  await fetch(`${SUPABASE_URL}/rest/v1/signups?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      ...supabaseHeaders(),
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

  const results = { email2: 0, email3: 0, email4: 0, skipped: 0, errors: 0 };

  // Email 2: step=1 and signed up 2+ days ago
  const batch2 = await fetchSignups(1, 2);
  const activated2 = await getActivatedEmails(batch2.map((r) => r.email));
  for (const row of batch2) {
    try {
      if (activated2.has(row.email)) {
        await markStep(row.id, 4); // skip sequence — already using the product
        results.skipped++;
        continue;
      }
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
  const activated3 = await getActivatedEmails(batch3.map((r) => r.email));
  for (const row of batch3) {
    try {
      if (activated3.has(row.email)) {
        await markStep(row.id, 4);
        results.skipped++;
        continue;
      }
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
  const activated4 = await getActivatedEmails(batch4.map((r) => r.email));
  for (const row of batch4) {
    try {
      if (activated4.has(row.email)) {
        await markStep(row.id, 4);
        results.skipped++;
        continue;
      }
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
