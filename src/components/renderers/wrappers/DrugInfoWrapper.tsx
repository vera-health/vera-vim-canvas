"use client";

import React, {useId, useState} from "react";
import {Pill, Copy, Check} from "lucide-react";

interface DrugInfoWrapperProps {
  children: React.ReactNode;
}

export const DrugInfoWrapper: React.FC<DrugInfoWrapperProps> = ({children}) => {
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
      console.error("Failed to copy drug info content:", error);
    }
  };

  return (
    <div className="mx-auto my-4 w-full max-w-2xl">
      {/* Header */}
      <div className="rounded-t-lg px-3 py-2" style={{backgroundColor: "#ecf5f2"}}>
        <div className="flex w-full items-center justify-between">
          <span className="flex items-center text-sm font-medium" style={{color: "#12695a"}}>
            <Pill className="mr-1.5 h-4 w-4" style={{color: "#16826a"}} />
            Drug Information
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
        <div className="prose max-w-none prose-ol:list-decimal prose-ul:list-disc prose-li:marker:text-gray-400">
          {children}
        </div>
      </div>
    </div>
  );
};
