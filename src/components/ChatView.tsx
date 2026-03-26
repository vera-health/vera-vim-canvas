"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useVimContext } from "@/hooks/useVimContext";
import { useVeraChat } from "@/hooks/useVeraChat";
import { formatEhrContext } from "@/utils/formatContext";
import { Message } from "@/components/Message";

export function ChatView() {
  const { patient, encounter } = useVimContext();
  const { messages, isStreaming, sendMessage } = useVeraChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendMessage(text, formatEhrContext(patient, encounter));
  }

  const patientName = [patient?.firstName, patient?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-indigo-600" />
          <span className="text-sm font-semibold">Vera</span>
        </div>
        {patientName && (
          <div className="mt-1 text-xs text-gray-500">
            Patient: {patientName}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Ask Vera anything about your patient
          </div>
        )}
        {messages.map((msg, i) => (
          <Message
            key={msg.id}
            message={msg}
            isStreaming={
              isStreaming &&
              msg.role === "assistant" &&
              i === messages.length - 1
            }
          />
        ))}
        {isStreaming && (
          <div className="text-xs text-gray-400">Vera is typing...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 px-4 py-3"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder="Ask Vera..."
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95l14.095-5.638a.75.75 0 0 0 0-1.398L3.105 2.289Z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
