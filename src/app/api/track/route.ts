import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/db";
import { parseUA } from "@/lib/ua-parser";

// POST /api/track — ingest a page visit (called non-blocking from middleware)
// This route is public — no auth required
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.page) return NextResponse.json({ ok: false }, { status: 400 });

    const { page, ip, ua, referrer } = body as {
      page: string;
      ip: string;
      ua: string;
      referrer: string;
    };

    const { browser, os, device } = parseUA(ua ?? "");

    // Skip bots from storage (still counted in request but not stored)
    if (device === "bot") return NextResponse.json({ ok: true });

    // Skip excluded IPs (e.g. owner's IP set via TRACKING_EXCLUDED_IPS env var)
    const excludedIps = (process.env.TRACKING_EXCLUDED_IPS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (excludedIps.length > 0 && excludedIps.includes(ip)) {
      return NextResponse.json({ ok: true });
    }

    // Geo lookup via ip-api.com (free, no key, 45 req/min limit)
    let country: string | null = null;
    let countryCode: string | null = null;
    let city: string | null = null;
    let region: string | null = null;

    const isLocal =
      !ip ||
      ip === "unknown" ||
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.");

    if (!isLocal) {
      try {
        const geo = await fetch(
          `http://ip-api.com/json/${ip}?fields=country,countryCode,city,regionName`,
          { signal: AbortSignal.timeout(2000) }
        );
        if (geo.ok) {
          const geoData = await geo.json();
          if (geoData.countryCode) {
            country = geoData.country ?? null;
            countryCode = geoData.countryCode ?? null;
            city = geoData.city ?? null;
            region = geoData.regionName ?? null;
          }
        }
      } catch {
        // geo lookup failed — store visit without geo, don't fail the request
      }
    } else {
      country = "Local";
      countryCode = "LC";
    }

    const db = getServerDb();
    await db.from("page_visits").insert({
      page,
      ip: ip ?? null,
      country,
      country_code: countryCode,
      city,
      region,
      user_agent: ua ?? null,
      browser,
      os,
      device,
      referrer: referrer || null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Never crash — this is fire-and-forget
    return NextResponse.json({ ok: false });
  }
}
