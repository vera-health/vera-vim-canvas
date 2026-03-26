"use client";

import React, {useId, useRef, useState} from "react";
import {Copy, Check} from "lucide-react";

interface GuidelineWrapperProps {
  children: React.ReactNode;
  authority?: string;
}

export const GuidelineWrapper: React.FC<GuidelineWrapperProps> = ({children, authority}) => {
  const contentId = useId();
  const [isCopied, setIsCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCopyClick = async () => {
    try {
      const contentText = contentRef.current?.innerText?.trim() || "";
      if (!contentText) return;
      await navigator.clipboard.writeText(contentText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    } catch (error) {
      console.error("Failed to copy guideline content:", error);
    }
  };

  const footerLabel = authority
    ? `Clinical Guideline · ${authority}`
    : "Clinical Guideline";

  return (
    <div className="group/guideline relative my-4 border-l-2 pl-4" style={{borderColor: "#1b779b"}}>
      {/* Header label */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs" style={{color: "var(--vera-grey-400)"}}>
          {footerLabel}
        </span>
        <button
          className="rounded p-1 opacity-0 transition-opacity group-hover/guideline:opacity-100 hover:bg-gray-100"
          title="Copy"
          type="button"
          onClick={handleCopyClick}
        >
          {isCopied ? (
            <Check className="h-3.5 w-3.5" style={{color: "var(--vera-grey-400)"}} />
          ) : (
            <Copy className="h-3.5 w-3.5" style={{color: "var(--vera-grey-400)"}} />
          )}
        </button>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="[&>*+*]:mt-3 [&>*+*]:border-t [&>*+*]:border-gray-100 [&>*+*]:pt-3"
        id={contentId}
      >
        {children}
      </div>
    </div>
  );
};
