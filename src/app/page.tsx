"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/utils/supabase";
import { ChatView } from "@/components/ChatView";
import { LoginView } from "@/components/LoginView";

export default function Page() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tell Vim Hub we're ready immediately, regardless of auth state
    const sdk = window.vimSdk;
    if (sdk?.hub?.setActivationStatus) {
      sdk.hub.setActivationStatus("ENABLED");
    }

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
  if (!session) return <LoginView />;
  return <ChatView />;
}
