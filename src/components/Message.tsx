"use client";

import { AnimatePresence } from "framer-motion";
import { CornerDownRight } from "lucide-react";
import type { Message as MessageType } from "@/hooks/useVeraChat";
import { CustomASTRenderer } from "@/components/renderers";
import ThinkingSteps from "./ThinkingSteps";

export function Message({
  message,
  isStreaming,
  onQuestionClick,
}: {
  message: MessageType;
  isStreaming?: boolean;
  onQuestionClick?: (question: string) => void;
}) {
  const isUser = message.role === "user";
  const hasContent = message.content.length > 0;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] rounded-2xl px-3 py-3 text-sm leading-relaxed"
          style={{
            backgroundColor: "#EDF1F5",
            color: "#37475E",
            fontFamily: "Manrope, system-ui, sans-serif",
          }}
        >
          <span className="whitespace-pre-wrap">{message.content}</span>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start">
      <div
        className="w-full text-sm leading-relaxed vera-prose"
        style={{
          color: "#37475E",
          fontFamily: "Manrope, system-ui, sans-serif",
        }}
      >
        {/* Grok-style ephemeral steps + Vercel-style reasoning */}
        <AnimatePresence>
          {message.thinking && (
            <ThinkingSteps thinking={message.thinking} hasContent={hasContent} />
          )}
        </AnimatePresence>

        {/* AST-rendered content */}
        {message.mdast ? (
          <CustomASTRenderer
            ast={message.mdast}
            isStreaming={isStreaming}
          />
        ) : hasContent ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : null}

        {/* Perplexity-style follow-up questions */}
        {!isStreaming && message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold mb-2" style={{ color: "#37475E" }}>
              Suggested questions
            </p>
            <div style={{ borderTop: "1px solid #EDF1F5" }}>
              {message.suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onQuestionClick?.(q)}
                  className="flex w-full items-center gap-2.5 py-2.5 text-left text-sm cursor-pointer"
                  style={{
                    borderBottom: "1px solid #EDF1F5",
                    color: "#37475E",
                    fontFamily: "Manrope, system-ui, sans-serif",
                  }}
                >
                  <CornerDownRight className="h-4 w-4 shrink-0" style={{ color: "#8090A6" }} />
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
