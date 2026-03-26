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
  const [isVimEnv, setIsVimEnv] = useState(false);

  useEffect(() => {
    // Initialize VimOS SDK
    async function initVim() {
      const sdk = window.vimSdk;
      if (!sdk?.initializeVimSDK) return;
      try {
        setIsVimEnv(true);
        const os = await sdk.initializeVimSDK();
        if (os?.hub?.setActivationStatus) {
          os.hub.setActivationStatus("ENABLED");
        }
        setVimOS(os);
        // Inside Vim, skip Supabase auth — user already authenticated via Vim OAuth
        setLoading(false);
      } catch (e) {
        console.error("VimOS init failed:", e);
        setLoading(false);
      }
    }
    initVim();

    // Supabase auth (for standalone usage outside Vim)
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

  // Inside Vim: always show chat (authenticated via Vim OAuth)
  // Outside Vim: require Supabase login
  const authenticated = isVimEnv || session;

  return (
    <VimContext value={vimOS}>
      {authenticated ? <ChatView /> : <LoginView />}
    </VimContext>
  );
}
