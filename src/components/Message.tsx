"use client";

import type { Message as MessageType } from "@/hooks/useVeraChat";

export function Message({
  message,
  isStreaming,
}: {
  message: MessageType;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        <span className="whitespace-pre-wrap">{message.content}</span>
        {isStreaming && !isUser && (
          <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-gray-400" />
        )}
      </div>
    </div>
  );
}
