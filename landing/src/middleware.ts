import { NextRequest, NextResponse } from "next/server";

function shouldTrack(pathname: string): boolean {
  return (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.includes(".")
  );
}

export async function middleware(req: NextRequest) {
  if (shouldTrack(req.nextUrl.pathname)) {
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
        page: req.nextUrl.pathname,
        ip,
        ua: req.headers.get("user-agent") ?? "",
        referrer: req.headers.get("referer") ?? "",
      }),
    }).catch(() => {});
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
