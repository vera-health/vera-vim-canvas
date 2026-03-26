import { NextRequest } from "next/server";
import { z } from "zod";

const VIM_CLIENT_ID = process.env.VIM_CLIENT_ID || "";
const VIM_CLIENT_SECRET = process.env.VIM_CLIENT_SECRET || "";

const tokenBody = z.object({
  code: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = tokenBody.safeParse(raw);
    if (!parsed.success) {
      return Response.json(
        { error: "Missing or invalid authorization code" },
        { status: 400 },
      );
    }

    const tokenRes = await fetch("https://api.getvim.com/v1/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: VIM_CLIENT_ID,
        client_secret: VIM_CLIENT_SECRET,
        code: parsed.data.code,
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
  } catch (err) {
    console.error("[/api/vim/token] Unexpected error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
