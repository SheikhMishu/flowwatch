import { getServerDb } from "@/lib/db";

export const DEMO_SESSION_COOKIE = "fw_demo_session";

const DEDUP_WINDOW_SECONDS = 30;

export async function startDemoSession(sessionToken: string, ip?: string) {
  try {
    const db = getServerDb();
    await db.from("demo_sessions").insert({
      session_token: sessionToken,
      ip: ip ?? null,
    });
  } catch {
    // fire-and-forget — never break demo login
  }
}

export async function trackDemoPageVisit(sessionToken: string, page: string) {
  try {
    const db = getServerDb();
    const dedupCutoff = new Date(Date.now() - DEDUP_WINDOW_SECONDS * 1000).toISOString();

    // Skip if this exact page was visited within the dedup window
    const { data: recent } = await db
      .from("demo_page_visits")
      .select("id")
      .eq("session_token", sessionToken)
      .eq("page", page)
      .gte("visited_at", dedupCutoff)
      .limit(1)
      .single();

    if (recent) return;

    await db.from("demo_page_visits").insert({ session_token: sessionToken, page });
    await db.rpc("demo_increment_page_count", { p_token: sessionToken });
  } catch {
    // fire-and-forget
  }
}
