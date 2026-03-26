"use client";

import { useCallback, useRef, useState } from "react";
import type { VeraRoot } from "@/types/customAST";
import type { ThinkingState, ThinkingStep } from "@/types/chat";
import { getSupabase } from "@/utils/supabase";
import { consumeVeraStream } from "@/utils/vera-stream";
import { parseCompleteMarkdown, parsePartialMarkdown } from "@/utils/mdast/parsers";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  mdast?: VeraRoot;
  thinking?: ThinkingState;
};

function defaultThinkingState(): ThinkingState {
  return {
    steps: [
      { text: "Analyzing your question…", status: "active", reasoning: "" },
    ],
    searchReasoning: "",
    sourceCount: 0,
    searchDone: false,
    isThinking: true,
    startedAt: Date.now(),
    completedAt: null,
  };
}

function mapApiStep(step: {
  text: string;
  isActive?: boolean;
  isCompleted?: boolean;
  reasoning?: string;
}): ThinkingStep {
  let status: ThinkingStep["status"] = "pending";
  if (step.isCompleted) status = "completed";
  else if (step.isActive) status = "active";
  return { text: step.text, status, reasoning: step.reasoning ?? "" };
}

export function useVeraChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const threadIdRef = useRef<string | null>(null);

  const updateThinking = (
    assistantId: string,
    updater: (t: ThinkingState) => ThinkingState,
  ) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? { ...m, thinking: updater(m.thinking ?? defaultThinkingState()) }
          : m,
      ),
    );
  };

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
        thinking: defaultThinkingState(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const fullQuestion = (ehrContext || "") + question;
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

        await consumeVeraStream(res, {
          onDelta(delta) {
            contentBuffer.current += delta;
            const content = contentBuffer.current;

            let mdast: VeraRoot | undefined;
            try {
              mdast = parsePartialMarkdown(content);
            } catch (e) {
              console.error("[useVeraChat] parsePartialMarkdown failed:", e);
            }

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content, mdast } : m,
              ),
            );
          },

          onFinish(tid) {
            threadIdRef.current = tid;
            updateThinking(assistantId, (t) => ({
              ...t,
              isThinking: false,
              completedAt: Date.now(),
            }));
          },

          onSearchSteps(steps) {
            updateThinking(assistantId, (t) => ({
              ...t,
              steps: steps.map(mapApiStep),
            }));
          },

          onDynamicReasoningStep(step) {
            updateThinking(assistantId, (t) => {
              const newSteps = [...t.steps];
              newSteps[step.index] = {
                text: step.title || step.text,
                status: "active",
                reasoning: step.reasoning ?? "",
              };
              return { ...t, steps: newSteps };
            });
          },

          onReasoningDelta({ stepIndex, delta }) {
            updateThinking(assistantId, (t) => {
              const newSteps = [...t.steps];
              if (newSteps[stepIndex]) {
                newSteps[stepIndex] = {
                  ...newSteps[stepIndex],
                  reasoning: newSteps[stepIndex].reasoning + delta,
                };
              }
              return { ...t, steps: newSteps };
            });
          },

          onReasoningStepComplete({ stepIndex }) {
            updateThinking(assistantId, (t) => {
              const newSteps = [...t.steps];
              if (newSteps[stepIndex]) {
                newSteps[stepIndex] = {
                  ...newSteps[stepIndex],
                  status: "completed",
                };
              }
              return { ...t, steps: newSteps };
            });
          },

          onSearchReasoning(data) {
            updateThinking(assistantId, (t) => {
              if (typeof data === "string") {
                return { ...t, searchReasoning: t.searchReasoning + data };
              }
              if ("reset" in data && data.reset) {
                return { ...t, searchReasoning: "" };
              }
              if ("content" in data) {
                return { ...t, searchReasoning: t.searchReasoning + data.content };
              }
              return t;
            });
          },

          onSearchProgress({ total }) {
            updateThinking(assistantId, (t) => ({
              ...t,
              sourceCount: total,
            }));
          },

          onSearchProgressSummary({ total }) {
            updateThinking(assistantId, (t) => ({
              ...t,
              sourceCount: total,
              searchDone: true,
            }));
          },
        });

        // Final parse with complete markdown
        try {
          const finalMdast = parseCompleteMarkdown(contentBuffer.current);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, mdast: finalMdast } : m,
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
        updateThinking(assistantId, (t) => ({
          ...t,
          isThinking: false,
          completedAt: Date.now(),
        }));
      } finally {
        setIsStreaming(false);
      }
    },
    [],
  );

  return { messages, isStreaming, sendMessage };
}
