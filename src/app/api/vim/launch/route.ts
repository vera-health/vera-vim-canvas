import { NextRequest, NextResponse } from "next/server";

const VIM_CLIENT_ID = process.env.VIM_CLIENT_ID || "";

export async function GET(req: NextRequest) {
  const launchId = req.nextUrl.searchParams.get("launch_id");

  if (!launchId) {
    return new Response("Missing launch_id", { status: 400 });
  }

  const origin = req.nextUrl.origin;

  const authUrl = new URL("https://api.getvim.com/v1/oauth/authorize");
  authUrl.searchParams.set("launch_id", launchId);
  authUrl.searchParams.set("client_id", VIM_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", origin);
  authUrl.searchParams.set("response_type", "code");

  return NextResponse.redirect(authUrl.toString());
}
