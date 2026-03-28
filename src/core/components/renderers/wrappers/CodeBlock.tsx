"use client";

import React, {useState} from "react";
import {Copy, Check} from "lucide-react";

interface CodeBlockProps {
  lang?: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({lang, value}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    } catch (error) {
      console.error("Failed to copy code block:", error);
    }
  };

  return (
    <pre className="relative mb-4 overflow-x-auto rounded bg-gray-800 p-4 text-gray-100">
      <button
        className="absolute right-2 top-2 rounded p-1 hover:bg-gray-600"
        title="Copy"
        type="button"
        onClick={handleCopyClick}
      >
        {isCopied ? (
          <Check className="h-4 w-4 text-gray-300" />
        ) : (
          <Copy className="h-4 w-4 text-gray-300" />
        )}
      </button>
      <code className={lang ? `language-${lang}` : ""}>{value}</code>
    </pre>
  );
};
