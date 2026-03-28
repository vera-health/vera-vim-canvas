import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
    _client = createClient(url, key, {
      global: {
        // Guard against webview environments (e.g. Vim Canvas) where fetch
        // responses may lack a proper `.headers` object, causing
        // supabase auth-js to crash on `response.headers.get(...)`.
        fetch: async (input, init) => {
          const res = await fetch(input, init);
          if (!res.headers || typeof res.headers.get !== "function") {
            return new Response(res.body, {
              status: res.status,
              statusText: res.statusText,
              headers: new Headers(),
            });
          }
          return res;
        },
      },
    });
  }
  return _client;
}
