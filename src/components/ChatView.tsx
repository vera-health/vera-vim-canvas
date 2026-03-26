"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { useVimContext } from "@/hooks/useVimContext";
import { useVeraChat } from "@/hooks/useVeraChat";
import { formatEhrContext } from "@/utils/formatContext";
import { Message } from "@/components/Message";
import { ReferenceTooltipDisplay } from "@/components/renderers/ReferenceTooltip";

export function ChatView() {
  const { patient, encounter } = useVimContext();
  const { messages, isStreaming, sendMessage, stopStream } = useVeraChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    userScrolledUp.current = !atBottom;
  }, []);

  useEffect(() => {
    if (!userScrolledUp.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
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

  const sampleQuestions = [
    "Summarize this patient's active problems",
    "Write patient instructions for this visit",
    "What are the latest guidelines on Type 2 Diabetes management?",
  ];

  function handleSampleClick(question: string) {
    if (isStreaming) return;
    sendMessage(question, formatEhrContext(patient, encounter));
  }

  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: "#FFFFFF" }}>
      <ReferenceTooltipDisplay />
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid #EDF2F7" }}>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#1b779b" }} />
          <span className="text-sm font-semibold" style={{ color: "#37475E" }}>
            Vera
          </span>
        </div>
        {patientName && (
          <div className="mt-1 text-xs" style={{ color: "#687076" }}>
            Patient: {patientName}
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <span className="text-sm" style={{ color: "#8090A6" }}>
              Ask Vera anything about your patient
            </span>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {sampleQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSampleClick(q)}
                  className="rounded-xl border px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50"
                  style={{
                    borderColor: "#EDF1F5",
                    color: "#37475E",
                    fontFamily: "Manrope, system-ui, sans-serif",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3" style={{ borderTop: "1px solid #EDF2F7" }}>
        <form onSubmit={handleSubmit}>
          <div
            className="flex items-center gap-2 rounded-[20px] border px-4 py-2"
            style={{
              borderColor: "#EDF1F5",
              backgroundColor: "#FFFFFF",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
              placeholder="Ask Vera..."
              className="flex-1 text-sm outline-none disabled:opacity-50"
              style={{
                color: "#151718",
                fontFamily: "Manrope, system-ui, sans-serif",
                fontWeight: 400,
              }}
            />
            <button
              type="submit"
              disabled={isStreaming ? false : !input.trim()}
              onClick={isStreaming ? (e) => { e.preventDefault(); stopStream(); } : undefined}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-opacity disabled:opacity-50"
              style={{
                backgroundColor: "#486081",
                color: "#FFFFFF",
              }}
            >
              {isStreaming ? (
                <Square className="h-3.5 w-3.5" fill="currentColor" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
