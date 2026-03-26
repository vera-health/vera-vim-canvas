"use client";

import { useCallback, useRef, useState } from "react";
import { getSupabase } from "@/utils/supabase";
import { consumeVeraStream } from "@/utils/vera-stream";


export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function useVeraChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const threadIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(
    async (question: string, ehrContext?: string) => {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: question,
      };
      const assistantId = crypto.randomUUID();
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const fullQuestion = (ehrContext || "") + question;

      try {
        const {
          data: { session },
        } = await getSupabase().auth.getSession();

        if (!session) {
          throw new Error("Not authenticated");
        }

        const res = await fetch(`/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            question: fullQuestion,
            threadId: threadIdRef.current || undefined,
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        await consumeVeraStream(
          res,
          (delta) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + delta }
                  : m,
              ),
            );
          },
          (tid) => {
            threadIdRef.current = tid;
          },
        );
      } catch (err) {
        const errorText =
          err instanceof Error ? err.message : "Unknown error";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Error: ${errorText}` }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [],
  );

  return { messages, isStreaming, sendMessage };
}
