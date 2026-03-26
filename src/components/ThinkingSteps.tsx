"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ThinkingState } from "@/types/chat";
import ThinkingStepRow from "./ThinkingStepRow";
import { SourceCounter } from "./SourceCounter";
import { ReasoningBlock } from "./ReasoningBlock";

export default function ThinkingSteps({
  thinking,
  hasContent,
}: {
  thinking: ThinkingState;
  hasContent: boolean;
}) {
  const visibleSteps = thinking.steps.filter(
    (s) => s.status === "active" || s.status === "completed",
  );

  const showSteps = !hasContent && visibleSteps.length > 0;
  const hasReasoning = thinking.searchReasoning.length > 0;

  if (!showSteps && !hasReasoning) {
    return null;
  }

  return (
    <div className="py-2">
      <AnimatePresence mode="popLayout">
        {showSteps && (
          <motion.div
            key="steps"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-2"
          >
            {visibleSteps.map((step) => (
              <ThinkingStepRow key={step.text} step={step} />
            ))}
            {thinking.sourceCount > 0 && !thinking.searchDone && (
              <SourceCounter key="searching" count={thinking.sourceCount} label="Searching" />
            )}
            {thinking.searchDone && thinking.sourceCount > 0 && (
              <SourceCounter key="reading" count={thinking.sourceCount} label="Reading" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {hasReasoning && (
        <ReasoningBlock
          text={thinking.searchReasoning}
          isStreaming={thinking.isThinking}
        />
      )}
    </div>
  );
}
