import { NextRequest } from "next/server";
import { z } from "zod";

export const maxDuration = 300;

const VERA_API_URL =
  process.env.NEXT_PUBLIC_VERA_API_URL || "http://localhost:3000";
const BYPASS_TOKEN = process.env.VERA_VERCEL_BYPASS_TOKEN || "";

const chatBody = z.object({
  question: z.string(),
  threadId: z.string().optional(),
  messageId: z.string().optional(),
  context: z.unknown().optional(),
}).passthrough();

export async function POST(req: NextRequest) {
  try {
    console.log("[/api/chat] Request received");

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await req.json();
    const parsed = chatBody.safeParse(raw);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: authHeader,
    };

    if (BYPASS_TOKEN) {
      headers["x-vercel-protection-bypass"] = BYPASS_TOKEN;
    }

    const veraRes = await fetch(`${VERA_API_URL}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(parsed.data),
    });

    console.log("[/api/chat] Vera responded with status:", veraRes.status);

    if (!veraRes.ok) {
      const errBody = await veraRes.text();
      console.error("[/api/chat] Vera error:", errBody);
      return Response.json(
        { error: veraRes.statusText },
        { status: veraRes.status },
      );
    }

    console.log("[/api/chat] Streaming SSE response back to client");
    return new Response(veraRes.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Thread-Id": veraRes.headers.get("x-thread-id") || "",
        "X-Message-Id": veraRes.headers.get("x-message-id") || "",
      },
    });
  } catch (err) {
    console.error("[/api/chat] Unexpected error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
