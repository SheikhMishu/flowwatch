import { NextRequest, NextResponse } from "next/server";

const NOTRACK_COOKIE = "fm_notrack";

function shouldTrack(pathname: string): boolean {
  return (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.includes(".")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasNotrackParam = req.nextUrl.searchParams.has("notrack");
  const hasNotrackCookie = req.cookies.has(NOTRACK_COOKIE);
  const optedOut = hasNotrackParam || hasNotrackCookie;

  if (shouldTrack(pathname) && !optedOut) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      req.headers.get("cf-connecting-ip") ??
      "unknown";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.flowmonix.com";
    fetch(`${appUrl}/api/track`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        page: pathname,
        ip,
        ua: req.headers.get("user-agent") ?? "",
        referrer: req.headers.get("referer") ?? "",
      }),
    }).catch(() => {});
  }

  const res = NextResponse.next();

  if (hasNotrackParam && !hasNotrackCookie) {
    res.cookies.set(NOTRACK_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest|robots|sitemap|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt)$).*)"],
};
