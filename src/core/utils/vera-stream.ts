export type StreamCallbacks = {
  onDelta: (text: string) => void;
  onFinish: (threadId: string) => void;
  onSearchSteps?: (
    steps: Array<{
      text: string;
      isActive?: boolean;
      isCompleted?: boolean;
      isDynamicReasoning?: boolean;
      isReasoningStep?: boolean;
      info?: string;
      reasoning?: string;
    }>,
  ) => void;
  onDynamicReasoningStep?: (step: {
    title: string;
    text: string;
    reasoning: string;
    index: number;
  }) => void;
  onReasoningDelta?: (data: { stepIndex: number; delta: string }) => void;
  onReasoningStepComplete?: (data: { stepIndex: number }) => void;
  onSearchReasoning?: (
    data: string | { content: string } | { reset: true },
  ) => void;
  onSearchProgress?: (data: { category: string; total: number }) => void;
  onSearchProgressSummary?: (data: { total: number }) => void;
  onSuggestedQuestions?: (questions: string[]) => void;
  onReferences?: (refs: any[]) => void;
  onEvidenceLevels?: (levels: Record<string, any>) => void;
};

export async function consumeVeraStream(
  response: Response,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  if (!response.body) {
    console.error("[Vera] consumeVeraStream: response.body is null");
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let threadId = "";

  // If already aborted, cancel immediately
  if (signal?.aborted) {
    await reader.cancel();
    return;
  }

  // Listen for abort to cancel the reader
  const onAbort = () => reader.cancel();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith(":")) continue;

      if (trimmed.startsWith("data: ")) {
        try {
          const event = JSON.parse(trimmed.slice(6));

          switch (event.type) {
            case "thread-info":
              threadId = event.threadId;
              break;

            case "text-delta":
              callbacks.onDelta(event.delta);
              break;

            case "finish":
              callbacks.onFinish(threadId);
              return;

            case "data-stop":
              callbacks.onDelta(
                `\n\nError: ${event.data?.message || event.error || "Stream stopped"}`,
              );
              return;

            case "data-search-steps":
              callbacks.onSearchSteps?.(event.data);
              break;

            case "data-dynamic-reasoning-step":
              callbacks.onDynamicReasoningStep?.(event.data);
              break;

            case "data-reasoning-for-step":
              callbacks.onReasoningDelta?.({
                stepIndex: event.data.stepIndex,
                delta: event.data.delta,
              });
              break;

            case "data-reasoning-for-step-complete":
              callbacks.onReasoningStepComplete?.({
                stepIndex: event.data.stepIndex,
              });
              break;

            case "data-search-reasoning":
              callbacks.onSearchReasoning?.(event.data);
              break;

            case "data-search-progress":
              callbacks.onSearchProgress?.(event.data);
              break;

            case "data-search-progress-summary":
              callbacks.onSearchProgressSummary?.(event.data);
              break;

            case "data-suggest": {
              const d = event.data;
              if (d) {
                const questions = Object.keys(d)
                  .filter((k) => k.startsWith("question_"))
                  .sort()
                  .map((k) => d[k])
                  .filter(Boolean);
                if (questions.length > 0) {
                  callbacks.onSuggestedQuestions?.(questions);
                }
              }
              break;
            }

            case "data-references":
              callbacks.onReferences?.(event.references ?? event.data);
              break;

            case "data-evidence-levels":
              callbacks.onEvidenceLevels?.(event.evidenceLevels ?? event.data);
              break;
          }
        } catch {
          // Malformed JSON line, skip
        }
      }
    }
  }
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}
