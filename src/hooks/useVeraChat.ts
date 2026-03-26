"use client";

import { useCallback, useRef, useState } from "react";
import type { VeraRoot } from "@/types/customAST";
import type { ThinkingState, ThinkingStep } from "@/types/chat";
import { getSupabase } from "@/utils/supabase";
import { consumeVeraStream } from "@/utils/vera-stream";
import { parseCompleteMarkdown, parsePartialMarkdown } from "@/utils/mdast/parsers";

/** Minimum ms between partial markdown parses during streaming. */
const PARSE_THROTTLE_MS = 80;

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  mdast?: VeraRoot;
  thinking?: ThinkingState;
  suggestedQuestions?: string[];
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
  const abortRef = useRef<AbortController | null>(null);

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
      let lastParseTime = 0;
      let pendingParseTimer: ReturnType<typeof setTimeout> | null = null;

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

        await consumeVeraStream(res, {
          onDelta(delta) {
            contentBuffer.current += delta;
            const content = contentBuffer.current;

            const doParse = () => {
              pendingParseTimer = null;
              lastParseTime = Date.now();
              const snapshot = contentBuffer.current;
              let mdast: VeraRoot | undefined;
              try {
                mdast = parsePartialMarkdown(snapshot);
              } catch (e) {
                console.error("[useVeraChat] parsePartialMarkdown failed:", e);
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: snapshot, mdast } : m,
                ),
              );
            };

            const elapsed = Date.now() - lastParseTime;
            if (elapsed >= PARSE_THROTTLE_MS) {
              if (pendingParseTimer) {
                clearTimeout(pendingParseTimer);
                pendingParseTimer = null;
              }
              doParse();
            } else if (!pendingParseTimer) {
              pendingParseTimer = setTimeout(doParse, PARSE_THROTTLE_MS - elapsed);
            }
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

          onSuggestedQuestions(questions) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, suggestedQuestions: questions }
                  : m,
              ),
            );
          },
        }, controller.signal);

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
        updateThinking(assistantId, (t) => ({
          ...t,
          isThinking: false,
          completedAt: Date.now(),
        }));
      } finally {
        if (pendingParseTimer) clearTimeout(pendingParseTimer);
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
