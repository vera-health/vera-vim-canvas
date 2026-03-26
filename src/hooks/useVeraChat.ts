"use client";

import { useCallback, useRef, useState } from "react";
import type { VeraRoot } from "@/types/customAST";
import { getSupabase } from "@/utils/supabase";
import { consumeVeraStream } from "@/utils/vera-stream";
import { parseCompleteMarkdown, parsePartialMarkdown } from "@/utils/mdast/parsers";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  mdast?: VeraRoot;
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
      // Buffer to accumulate the full text for AST parsing
      const contentBuffer = { current: "" };

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
            contentBuffer.current += delta;
            const content = contentBuffer.current;

            // Parse markdown to AST (throttled by requestAnimationFrame naturally)
            let mdast: VeraRoot | undefined;
            try {
              mdast = parsePartialMarkdown(content);
            } catch (e) {
              console.error("[useVeraChat] parsePartialMarkdown failed:", e);
            }

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content, mdast }
                  : m,
              ),
            );
          },
          (tid) => {
            threadIdRef.current = tid;
          },
        );

        // Final parse with complete markdown (no remending needed)
        try {
          const finalMdast = parseCompleteMarkdown(contentBuffer.current);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, mdast: finalMdast }
                : m,
            ),
          );
        } catch (e) {
          console.error("[useVeraChat] parseCompleteMarkdown failed:", e);
        }
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
