"use client";

import React, {useId, useState} from "react";
import {BookOpen, Copy, Check} from "lucide-react";

interface GuidelineWrapperProps {
  children: React.ReactNode;
  authority?: string;
}

export const GuidelineWrapper: React.FC<GuidelineWrapperProps> = ({children, authority}) => {
  const contentId = useId();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyClick = async () => {
    try {
      const contentElement = document.getElementById(contentId);
      const contentText = contentElement?.innerText?.trim() || "";
      if (!contentText) return;
      await navigator.clipboard.writeText(contentText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    } catch (error) {
      console.error("Failed to copy guideline content:", error);
    }
  };

  const label = authority
    ? `Clinical Guideline · ${authority}`
    : "Clinical Guideline";

  return (
    <div className="mx-auto my-4 w-full max-w-2xl">
      {/* Header */}
      <div className="rounded-t-lg px-3 py-2" style={{backgroundColor: "#eef4f7"}}>
        <div className="flex w-full items-center justify-between">
          <span className="flex items-center text-sm font-medium" style={{color: "#155f7c"}}>
            <BookOpen className="mr-1.5 h-4 w-4" style={{color: "#1b779b"}} />
            {label}
          </span>
          <button
            className="rounded p-1 hover:bg-gray-200"
            title="Copy"
            type="button"
            onClick={handleCopyClick}
          >
            {isCopied ? (
              <Check className="h-4 w-4 text-gray-600" />
            ) : (
              <Copy className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-b-lg border-x border-b border-gray-200 p-4" id={contentId}>
        {children}
      </div>
    </div>
  );
};
