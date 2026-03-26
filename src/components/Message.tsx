"use client";

import { AnimatePresence } from "framer-motion";
import type { Message as MessageType } from "@/hooks/useVeraChat";
import { CustomASTRenderer } from "@/components/renderers";
import ThinkingSteps from "./ThinkingSteps";

export function Message({
  message,
  isStreaming,
}: {
  message: MessageType;
  isStreaming?: boolean;
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
      </div>
    </div>
  );
}
