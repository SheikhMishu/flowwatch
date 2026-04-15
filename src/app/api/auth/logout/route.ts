import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST() {
  const session = await getSession();
  if (session) {
    logActivity(session, "auth.logout");
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({ name: "fw_session", value: "", maxAge: 0, path: "/" });
  return response;
}
