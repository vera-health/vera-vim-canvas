import { NextRequest } from "next/server";

export const maxDuration = 60;

const VERA_API_URL =
  process.env.NEXT_PUBLIC_VERA_API_URL || "http://localhost:3000";
const BYPASS_TOKEN = process.env.VERA_VERCEL_BYPASS_TOKEN || "";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio");
    if (!audioFile) {
      return Response.json({ error: "Missing audio file" }, { status: 400 });
    }

    const upstreamForm = new FormData();
    upstreamForm.append("audio", audioFile);

    const headers: Record<string, string> = {
      Authorization: authHeader,
    };
    if (BYPASS_TOKEN) {
      headers["x-vercel-protection-bypass"] = BYPASS_TOKEN;
    }

    const veraRes = await fetch(
      `${VERA_API_URL}/api/voice/transcribe-audio`,
      {
        method: "POST",
        headers,
        body: upstreamForm,
      },
    );

    if (!veraRes.ok) {
      const errBody = await veraRes.text();
      console.error("[/api/transcribe] Vera error:", errBody);
      return Response.json(
        { error: veraRes.statusText },
        { status: veraRes.status },
      );
    }

    const data = await veraRes.json();
    return Response.json(data);
  } catch (err) {
    console.error("[/api/transcribe] Unexpected error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
