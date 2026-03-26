"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Square, RotateCcw, Settings, LogOut, MessageSquare, HelpCircle, Mic, X, Check, Maximize2, Minimize2, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useVimContext } from "@/hooks/useVimContext";
import { useVimOS } from "@/app/page";
import { useVeraChat } from "@/hooks/useVeraChat";
import { useWhisper } from "@/hooks/useWhisper";
import { useEhrNotifications } from "@/hooks/useEhrNotifications";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useExpandState } from "@/hooks/useExpandState";
import { formatEhrContext } from "@/utils/formatContext";
import { Message } from "@/components/Message";
import { ReferenceTooltipDisplay } from "@/components/renderers/ReferenceTooltip";
import { getSupabase } from "@/utils/supabase";
import { ALL_NOTIFICATION_TYPES, NOTIFICATION_TYPE_LABELS } from "@/types/notification";
import { Tooltip } from "@/components/Tooltip";
import { HelpScreen } from "@/components/HelpScreen";
import { AdminPanel } from "@/components/AdminPanel";
import { SendToEhrPopover } from "@/components/SendToEhrPopover";

export function ChatView() {
  const { patient, encounter, problems, medications, allergies, labs, vitals } = useVimContext();
  const { messages, isStreaming, sendMessage, stopStream, resetChat, regenerateMessage } = useVeraChat();
  const {
    state: whisperState,
    error: whisperError,
    duration,
    transcribedText,
    isSupported: micSupported,
    levels,
    startRecording,
    stopAndTranscribe,
    cancelRecording,
    clearTranscription,
  } = useWhisper();
  const {
    activeSuggestedQuestions,
    activePromptText,
  } = useEhrNotifications();
  const { preferences, toggleType } = useNotificationPreferences();
  const { expanded, toggle: toggleExpand } = useExpandState();
  const vimOS = useVimOS();
  const [input, setInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  // Fetch user email for admin access check
  useEffect(() => {
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });
  }, []);

  const isAdmin = userEmail === "maxime@verahealth.ai";

  // Auto-resize textarea up to 6 rows
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const lineHeight = 20;
    const padding = 16; // 8px top + 8px bottom
    const singleRowHeight = lineHeight + padding;
    const maxHeight = lineHeight * 6 + padding;
    ta.style.height = "auto";
    const targetHeight = input ? Math.min(ta.scrollHeight, maxHeight) : singleRowHeight;
    ta.style.height = `${targetHeight}px`;
    ta.style.overflowY = ta.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [input]);

  // Insert transcribed text into input
  useEffect(() => {
    if (transcribedText) {
      setInput((prev) => {
        const separator = prev.trim() ? " " : "";
        return prev + separator + transcribedText;
      });
      clearTranscription();
    }
  }, [transcribedText, clearTranscription]);

  // Keyboard shortcuts: Ctrl+D to toggle dictation, Esc to cancel, Enter to confirm
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Shift+E: toggle expanded view
      if (e.ctrlKey && e.shiftKey && e.key === "E") {
        e.preventDefault();
        toggleExpand();
        return;
      }
      // Ctrl+D: start dictation (when idle and not streaming)
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        if (whisperState === "idle" && !isStreaming && micSupported) {
          startRecording();
        } else if (whisperState === "recording") {
          cancelRecording();
        }
        return;
      }
      if (whisperState === "recording") {
        if (e.key === "Escape") {
          e.preventDefault();
          cancelRecording();
        } else if (e.key === "Enter") {
          e.preventDefault();
          stopAndTranscribe();
        }
        return;
      }
      // Cmd+Enter (Mac) / Ctrl+Enter: submit question
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (input.trim() && !isStreaming) {
          const text = input.trim();
          setInput("");
          sendMessage(text, formatEhrContext(patient, encounter, problems, medications, allergies, labs, vitals));
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [whisperState, isStreaming, micSupported, input, patient, encounter, problems, medications, allergies, labs, vitals, startRecording, cancelRecording, stopAndTranscribe, sendMessage, toggleExpand]);

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [settingsOpen]);

  // Sync expanded state with VimOS
  useEffect(() => {
    const hub = vimOS?.hub;
    if (!hub?.setDynamicAppSize) return;
    hub.setDynamicAppSize(expanded ? "LARGE" : "CLASSIC");
  }, [expanded, vimOS]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendMessage(text, formatEhrContext(patient, encounter, problems, medications, allergies, labs, vitals));
  }

  async function handleLogout() {
    setSettingsOpen(false);
    await getSupabase().auth.signOut();
  }

  const sampleQuestions = activeSuggestedQuestions;

  function handleSampleClick(question: string) {
    if (isStreaming) return;
    sendMessage(question, formatEhrContext(patient, encounter, problems, medications, allergies, labs, vitals));
  }

  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: "#FFFFFF" }}>
      {helpOpen && (
        <div className="absolute inset-0 z-50">
          <HelpScreen onBack={() => setHelpOpen(false)} />
        </div>
      )}
      {adminOpen && (
        <div className="absolute inset-0 z-50">
          <AdminPanel onBack={() => setAdminOpen(false)} />
        </div>
      )}
      <ReferenceTooltipDisplay />
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid #EDF2F7" }}>
        <div className="flex items-center gap-2">
          <img src="/vera-icon.png" alt="Vera" style={{ height: 24 }} />
          <span className="text-sm font-semibold" style={{ color: "#37475E" }}>Vera Health</span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip label="New conversation">
            <button
              type="button"
              onClick={resetChat}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
              style={{ color: "#687076" }}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </Tooltip>
          <div ref={settingsRef} className="relative">
            <Tooltip label="Settings">
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                style={{ color: "#687076" }}
              >
                <Settings className="h-4 w-4" />
              </button>
            </Tooltip>
            {settingsOpen && (
              <div
                className="absolute right-0 z-50 mt-1 w-44 rounded-xl border py-1"
                style={{
                  top: "100%",
                  backgroundColor: "#fff",
                  borderColor: "#EDF2F7",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}
              >
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      setAdminOpen(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                    style={{ color: "#37475E" }}
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false);
                    setHelpOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                  style={{ color: "#37475E" }}
                >
                  <HelpCircle className="h-4 w-4" />
                  What can Vera do?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false);
                    window.open("mailto:support@verahealth.ai?subject=Vera%20Feedback", "_blank");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                  style={{ color: "#37475E" }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Send Feedback
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                  style={{ color: "#37475E" }}
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
                <div style={{ borderTop: "1px solid #EDF2F7" }} className="px-3 py-2">
                  <label className="flex cursor-pointer items-center justify-between">
                    <span
                      className="flex items-center gap-1.5 text-xs"
                      style={{ color: "#37475E", fontFamily: "Manrope, system-ui, sans-serif" }}
                    >
                      {expanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                      Expanded view
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={expanded}
                      onClick={toggleExpand}
                      className="relative h-5 w-9 rounded-full transition-colors"
                      style={{
                        backgroundColor: expanded ? "#486081" : "#D1D5DB",
                      }}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
                        style={{
                          transform: expanded ? "translateX(16px)" : "translateX(0)",
                        }}
                      />
                    </button>
                  </label>
                </div>
                <div style={{ borderTop: "1px solid #EDF2F7" }} className="px-3 py-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#8090A6", fontFamily: "Manrope, system-ui, sans-serif" }}
                  >
                    Notifications
                  </span>
                  {ALL_NOTIFICATION_TYPES.map((type) => (
                    <label
                      key={type}
                      className="mt-1.5 flex cursor-pointer items-center justify-between"
                    >
                      <span
                        className="text-xs"
                        style={{ color: "#37475E", fontFamily: "Manrope, system-ui, sans-serif" }}
                      >
                        {NOTIFICATION_TYPE_LABELS[type]}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={preferences.enabled[type]}
                        onClick={() => toggleType(type)}
                        className="relative h-5 w-9 rounded-full transition-colors"
                        style={{
                          backgroundColor: preferences.enabled[type] ? "#486081" : "#D1D5DB",
                        }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
                          style={{
                            transform: preferences.enabled[type] ? "translateX(16px)" : "translateX(0)",
                          }}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        <SendToEhrPopover containerRef={scrollContainerRef} />
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <span className="text-sm" style={{ color: "#8090A6" }}>
              {activePromptText}
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
            onQuestionClick={(q) => handleSampleClick(q)}
            onRegenerate={msg.role === "assistant" ? regenerateMessage : undefined}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3" style={{ borderTop: "1px solid #EDF2F7" }}>
        <form onSubmit={handleSubmit}>
          <div
            className="relative flex items-end gap-2 rounded-[20px] border px-4 py-2"
            style={{
              borderColor: "#EDF1F5",
              backgroundColor: "#FFFFFF",
            }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
                  e.preventDefault();
                  if (input.trim() && !isStreaming) {
                    const text = input.trim();
                    setInput("");
                    sendMessage(text, formatEhrContext(patient, encounter, problems, medications, allergies, labs, vitals));
                  }
                }
              }}
              disabled={isStreaming || whisperState !== "idle"}
              placeholder="Ask Vera..."
              className="flex-1 text-sm outline-none disabled:opacity-50 resize-none leading-[20px]"
              style={{
                color: "#151718",
                fontFamily: "Manrope, system-ui, sans-serif",
                fontWeight: 400,
                paddingTop: 8,
                paddingBottom: 8,
              }}
            />
            <AnimatePresence mode="wait" initial={false}>
              {whisperState === "recording" ? (
                /* Recording pill — expands from right like Grok */
                <motion.div
                  key="recording"
                  initial={{ width: 40, opacity: 0.8 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 40, opacity: 0 }}
                  transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                  className="flex h-10 min-w-0 items-center rounded-full"
                  style={{
                    backgroundColor: "#f2f2f2",
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
                    overflow: "hidden",
                    originX: 1,
                  }}
                >
                  <div className="flex items-center gap-0.5 py-1 pl-3 pr-1">
                    {/* Waveform bars — driven by real mic levels */}
                    <div className="waveform-container">
                      {levels.map((level, i) => (
                        <div
                          key={i}
                          className="waveform-bar"
                          style={{ height: `${Math.max(3, level * 20)}px` }}
                        />
                      ))}
                    </div>
                    {/* Cancel */}
                    <Tooltip label="Cancel (Esc)">
                      <button
                        type="button"
                        onClick={cancelRecording}
                        className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                        style={{ color: "#687076" }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    {/* Confirm */}
                    <Tooltip label="Submit (Enter)">
                      <button
                        type="button"
                        onClick={stopAndTranscribe}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: "#486081", color: "#FFFFFF" }}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                </motion.div>
              ) : whisperState === "transcribing" ? (
                /* Transcribing pill */
                <motion.div
                  key="transcribing"
                  initial={{ width: 40, opacity: 0.8 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 40, opacity: 0 }}
                  transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                  className="flex h-10 min-w-0 items-center rounded-full px-4"
                  style={{
                    backgroundColor: "#f2f2f2",
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
                    overflow: "hidden",
                  }}
                >
                  <span
                    className="animate-pulse text-sm whitespace-nowrap"
                    style={{ color: "#687076", fontFamily: "Manrope, system-ui, sans-serif" }}
                  >
                    Transcribing…
                  </span>
                </motion.div>
              ) : (
                /* Normal controls: mic + send */
                <motion.div
                  key="idle"
                  className="flex items-center gap-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  {micSupported && !isStreaming && (
                    <Tooltip label="Dictation (⌃D)">
                      <button
                        type="button"
                        onClick={startRecording}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
                        style={{ color: "#687076" }}
                      >
                        <Mic className="h-[18px] w-[18px]" />
                      </button>
                    </Tooltip>
                  )}
                  <Tooltip label={isStreaming ? "Stop" : "Submit (⌘↵)"}>
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
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {whisperError && (
            <p className="mt-1 px-2 text-xs" style={{ color: "#d63152" }}>{whisperError}</p>
          )}
        </form>
      </div>
    </div>
  );
}
