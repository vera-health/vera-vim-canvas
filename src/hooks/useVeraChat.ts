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
  const abortRef = useRef<AbortController | null>(null);

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

        const controller = new AbortController();
        abortRef.current = controller;

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
          signal: controller.signal,
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
          controller.signal,
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
        // If the user stopped the stream, do a final parse on what we have
        if (err instanceof DOMException && err.name === "AbortError") {
          try {
            if (contentBuffer.current) {
              const finalMdast = parseCompleteMarkdown(contentBuffer.current);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, mdast: finalMdast }
                    : m,
                ),
              );
            }
          } catch {
            // parse failed, keep partial content as-is
          }
        } else {
          const errorText =
            err instanceof Error ? err.message : "Unknown error";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `Error: ${errorText}` }
                : m,
            ),
          );
        }
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [],
  );

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, isStreaming, sendMessage, stopStream };
}
