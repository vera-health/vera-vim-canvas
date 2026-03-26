import { NextRequest } from "next/server";

const VIM_CLIENT_ID = process.env.VIM_CLIENT_ID || "";
const VIM_CLIENT_SECRET = process.env.VIM_CLIENT_SECRET || "";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code } = body;

  if (!code) {
    return Response.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const tokenRes = await fetch("https://api.getvim.com/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: VIM_CLIENT_ID,
      client_secret: VIM_CLIENT_SECRET,
      code,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    return Response.json(
      { error: `Token exchange failed: ${errText}` },
      { status: tokenRes.status },
    );
  }

  const tokens = await tokenRes.json();
  return Response.json(tokens);
}
