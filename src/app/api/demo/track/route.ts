import { NextRequest, NextResponse } from "next/server";
import { trackDemoPageVisit, DEMO_SESSION_COOKIE } from "@/lib/demo-tracking";

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get(DEMO_SESSION_COOKIE)?.value;
  if (!sessionToken) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let page: string;
  try {
    const body = await req.json();
    page = typeof body.page === "string" ? body.page : "";
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!page) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  void trackDemoPageVisit(sessionToken, page);
  return NextResponse.json({ ok: true });
}
