"use client";

import { useState } from "react";
import { RotateCcw, Copy, Check, ThumbsUp, ThumbsDown, BookOpen, Pill } from "lucide-react";
import { Tooltip } from "./Tooltip";
import type { Message } from "@/core/hooks/useVeraChat";

interface ActionBarProps {
  message: Message;
  sourcesCount: number;
  drugsCount: number;
  onRegenerate: () => void;
  onOpenSources: () => void;
  onOpenDrugs: () => void;
}

export function ActionBar({ message, sourcesCount, drugsCount, onRegenerate, onOpenSources, onOpenDrugs }: ActionBarProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [feedback, setFeedback] = useState<"none" | "like" | "dislike">("none");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    } catch {
      // clipboard API may fail in some contexts
    }
  };

  const handleFeedback = (type: "like" | "dislike") => {
    setFeedback((prev) => (prev === type ? "none" : type));
  };

  const iconBtnClass =
    "flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-gray-100 cursor-pointer";

  return (
    <div className="mt-3 flex items-center gap-0.5">
      <Tooltip label="Regenerate">
        <button type="button" onClick={onRegenerate} className={iconBtnClass}>
          <RotateCcw className="h-4 w-4" style={{ color: "#687076" }} />
        </button>
      </Tooltip>

      <Tooltip label={isCopied ? "Copied!" : "Copy"}>
        <button type="button" onClick={handleCopy} className={iconBtnClass}>
          {isCopied ? (
            <Check className="h-4 w-4" style={{ color: "#687076" }} />
          ) : (
            <Copy className="h-4 w-4" style={{ color: "#687076" }} />
          )}
        </button>
      </Tooltip>

      <Tooltip label="Like">
        <button
          type="button"
          onClick={() => handleFeedback("like")}
          className={iconBtnClass}
        >
          <ThumbsUp
            className="h-4 w-4"
            style={{ color: feedback === "like" ? "#37475E" : "#687076" }}
            fill={feedback === "like" ? "#37475E" : "none"}
          />
        </button>
      </Tooltip>

      <Tooltip label="Dislike">
        <button
          type="button"
          onClick={() => handleFeedback("dislike")}
          className={iconBtnClass}
        >
          <ThumbsDown
            className="h-4 w-4"
            style={{ color: feedback === "dislike" ? "#37475E" : "#687076" }}
            fill={feedback === "dislike" ? "#37475E" : "none"}
          />
        </button>
      </Tooltip>

      <div className="flex-1" />

      {sourcesCount > 0 && (
        <button
          type="button"
          onClick={onOpenSources}
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors hover:bg-gray-200 cursor-pointer"
          style={{ backgroundColor: "#EDF1F5", color: "#37475E" }}
        >
          <BookOpen className="h-3.5 w-3.5" />
          {sourcesCount} source{sourcesCount !== 1 ? "s" : ""}
        </button>
      )}

      {drugsCount > 0 && (
        <button
          type="button"
          onClick={onOpenDrugs}
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors hover:bg-gray-200 cursor-pointer ml-1.5"
          style={{ backgroundColor: "#e3eef3", color: "#155f7c" }}
        >
          <Pill className="h-3.5 w-3.5" />
          {drugsCount} drug{drugsCount !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}
