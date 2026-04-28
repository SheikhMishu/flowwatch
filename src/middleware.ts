import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/"];
const AUTH_ROUTES = ["/login"];

const NOTRACK_COOKIE = "fm_notrack";

// Pages we track visits for (not API routes, not admin, not static)
function shouldTrack(pathname: string): boolean {
  return (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/_next/") &&
    !pathname.includes(".")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_ROUTES.some((r) => pathname === r) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/sync") ||
    pathname.startsWith("/api/status") ||
    pathname.startsWith("/api/billing/webhook") ||
    pathname.startsWith("/api/invites") ||
    pathname.startsWith("/api/track") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/status");
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  const token = req.cookies.get("fw_session")?.value;
  const session = token ? await verifySession(token) : null;

  // ?notrack in URL → set opt-out cookie (1 year)
  const hasNotrackParam = req.nextUrl.searchParams.has("notrack");
  const hasNotrackCookie = req.cookies.has(NOTRACK_COOKIE);
  const optedOut = hasNotrackParam || hasNotrackCookie;

  // Fire-and-forget page visit tracking (non-blocking)
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

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users to login
  if (!isPublic && !session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.next();

  // Persist the notrack opt-out as a cookie so future visits are also excluded
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
