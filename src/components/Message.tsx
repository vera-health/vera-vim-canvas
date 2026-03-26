"use client";

import type { Message as MessageType } from "@/hooks/useVeraChat";
import { CustomASTRenderer } from "@/components/renderers";

export function Message({
  message,
  isStreaming,
}: {
  message: MessageType;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    // User bubble — grey-100 bg, right-aligned, matching mobile QuestionCard
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

  // Assistant message — no bubble (flat, like mobile), full-width
  return (
    <div className="flex justify-start">
      <div
        className="w-full text-sm leading-relaxed vera-prose"
        style={{
          color: "#37475E",
          fontFamily: "Manrope, system-ui, sans-serif",
        }}
      >
        {message.mdast ? (
          <CustomASTRenderer
            ast={message.mdast}
            isStreaming={isStreaming}
          />
        ) : (
          <span className="whitespace-pre-wrap">{message.content}</span>
        )}
      </div>
    </div>
  );
}
