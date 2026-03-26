import { NextRequest } from "next/server";

const VERA_API_URL =
  process.env.NEXT_PUBLIC_VERA_API_URL || "http://localhost:3000";
const BYPASS_TOKEN = process.env.VERA_VERCEL_BYPASS_TOKEN || "";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();

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
    body: JSON.stringify(body),
  });

  if (!veraRes.ok) {
    return new Response(veraRes.statusText, { status: veraRes.status });
  }

  // Stream the SSE response back to the client
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
}
