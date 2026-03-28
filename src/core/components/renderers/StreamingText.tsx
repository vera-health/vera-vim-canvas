"use client";

import React, {useRef, useEffect} from "react";

/**
 * StreamingText — Per-word fade-in animation for streamed text.
 *
 * Splits text into words and wraps each in a <span>. React key
 * reconciliation ensures only NEW words trigger the CSS animation.
 * Already-visible words keep their completed opacity: 1 state.
 *
 * When `isStreaming` is false, renders plain text (zero DOM overhead).
 */

interface StreamingTextProps {
  value: string;
  isStreaming: boolean;
}

const StreamingText: React.FC<StreamingTextProps> = ({value, isStreaming}) => {
  const prevWordCountRef = useRef(0);

  // Split preserving whitespace: "Hello world" → ["Hello", " ", "world"]
  const tokens = value.split(/(\s+)/);
  const wordCount = tokens.filter((t) => t.trim()).length;

  useEffect(() => {
    if (!isStreaming) {
      // Reset when streaming ends
      prevWordCountRef.current = 0;

      return;
    }

    // Mark current words as "stable" after their animation completes
    const timer = setTimeout(() => {
      prevWordCountRef.current = wordCount;
    }, 500);

    return () => clearTimeout(timer);
  }, [wordCount, isStreaming]);

  if (!isStreaming) {
    return <>{value}</>;
  }

  let wordIndex = 0;

  return (
    <>
      {tokens.map((token, i) => {
        if (!token.trim()) {
          return <React.Fragment key={`ws-${i}`}>{token}</React.Fragment>;
        }

        const idx = wordIndex;
        wordIndex++;
        const isNew = idx >= prevWordCountRef.current;

        return (
          <span key={`w-${idx}`} className={isNew ? "stream-word" : undefined}>
            {token}
          </span>
        );
      })}
    </>
  );
};

export default React.memo(StreamingText);
