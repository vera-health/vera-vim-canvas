"use client";

import { useEffect, useState, createContext, useContext } from "react";
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
    // Initialize VimOS SDK
    async function initVim() {
      const sdk = window.vimSdk;
      if (!sdk?.initializeVimSDK) return;
      try {
        const os = await sdk.initializeVimSDK();
        os.hub.setActivationStatus("ENABLED");
        setVimOS(os);
      } catch (e) {
        console.error("VimOS init failed:", e);
      }
    }
    initVim();

    // Supabase auth
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
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
