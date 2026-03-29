"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/core/utils/supabase";
import { LoginView } from "@/core/components/LoginView";
import { ChatView } from "@/core/components/ChatView";

export default function StandalonePage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  if (!session) return <LoginView />;

  return (
    <ChatView
      ehrContextString=""
      activeSuggestedQuestions={[]}
      activePromptText=""
    />
  );
}
