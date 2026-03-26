"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { loadSdk } from "vim-os-js-browser";
import { getSupabase } from "@/utils/supabase";
import { ChatView } from "@/components/ChatView";
import { LoginView } from "@/components/LoginView";
import type { VimOS } from "@/types/vim";

export const VimContext = createContext<VimOS | null>(null);
export function useVimOS() {
  return useContext(VimContext);
}

export default function Page() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [vimOS, setVimOS] = useState<VimOS | null>(null);

  useEffect(() => {
    // Initialize VimOS SDK using the official package (same as demo app)
    async function initVim() {
      try {
        const os = (await loadSdk()) as unknown as VimOS;
        if (os?.hub?.setActivationStatus) {
          os.hub.setActivationStatus("ENABLED");
        }
        setVimOS(os);
      } catch (e) {
        console.error("VimOS init failed:", e);
      }
    }
    initVim();

    // Supabase auth (always required — Vera API needs the token)
    const supabase = getSupabase();

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch((err) => {
        console.error("[Vera] Failed to get session:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const result = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
      subscription = result.data.subscription;
    } catch (err) {
      console.error("[Vera] Failed to subscribe to auth changes:", err);
    }

    return () => subscription?.unsubscribe();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-sm text-gray-400">
        Loading...
      </div>
    );

  return (
    <VimContext value={vimOS}>
      {session ? <ChatView /> : <LoginView />}
    </VimContext>
  );
}
