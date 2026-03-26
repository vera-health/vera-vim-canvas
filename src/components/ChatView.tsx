"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
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
    <div className="flex h-screen flex-col" style={{ backgroundColor: "#FFFFFF" }}>
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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div
            className="flex h-full items-center justify-center text-sm"
            style={{ color: "#8090A6" }}
          >
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar — matches mobile SafeGlassView style */}
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
              onClick={isStreaming ? (e) => { e.preventDefault(); /* TODO: stop stream */ } : undefined}
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
