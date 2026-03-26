"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function SpinnerIcon({ size = 14 }: { size?: number }) {
  return (
    <svg height={size} viewBox="0 0 16 16" width={size} style={{ color: "currentcolor" }}>
      <g clipPath="url(#clip0_reason)">
        <path d="M8 0V4" stroke="currentColor" strokeWidth="1.5" />
        <path opacity="0.5" d="M8 16V12" stroke="currentColor" strokeWidth="1.5" />
        <path opacity="0.9" d="M3.29773 1.52783L5.64887 4.7639" stroke="currentColor" strokeWidth="1.5" />
        <path opacity="0.1" d="M12.7023 1.52783L10.3511 4.7639" stroke="currentColor" strokeWidth="1.5" />
        <path opacity="0.4" d="M12.7023 14.472L10.3511 11.236" stroke="currentColor" strokeWidth="1.5" />
        <path opacity="0.6" d="M3.29773 14.472L5.64887 11.236" stroke="currentColor" strokeWidth="1.5" />
        <path opacity="0.2" d="M15.6085 5.52783L11.8043 6.7639" stroke="currentColor" strokeWidth="1.5" />
        <path opacity="0.7" d="M0.391602 10.472L4.19583 9.23598" stroke="currentColor" strokeWidth="1.5" />
        <path opacity="0.3" d="M15.6085 10.4722L11.8043 9.2361" stroke="currentColor" strokeWidth="1.5" />
        <path opacity="0.8" d="M0.391602 5.52783L4.19583 6.7639" stroke="currentColor" strokeWidth="1.5" />
      </g>
      <defs>
        <clipPath id="clip0_reason">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg height={14} viewBox="0 0 16 16" width={14} style={{ color: "currentcolor" }}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.0607 6.74999L11.5303 7.28032L8.7071 10.1035C8.31657 10.4941 7.68341 10.4941 7.29288 10.1035L4.46966 7.28032L3.93933 6.74999L4.99999 5.68933L5.53032 6.21966L7.99999 8.68933L10.4697 6.21966L11 5.68933L12.0607 6.74999Z"
        fill="currentColor"
      />
    </svg>
  );
}

const variants = {
  collapsed: { height: 0, opacity: 0, marginTop: 0 },
  expanded: { height: "auto", opacity: 1, marginTop: 12 },
};

export function ReasoningBlock({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!isStreaming && text.length > 0) {
      setIsExpanded(false);
    }
  }, [isStreaming]);

  return (
    <div className="flex flex-col">
      {isStreaming ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--vera-grey-600)" }}>
            Reasoning
          </span>
          <div className="animate-spin" style={{ color: "var(--vera-grey-400)" }}>
            <SpinnerIcon />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--vera-grey-400)" }}>
            Reasoned for a few seconds
          </span>
          <button
            className="rounded-full cursor-pointer p-0.5 transition-colors"
            style={{ backgroundColor: isExpanded ? "var(--vera-grey-100)" : "transparent" }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className={`transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`}
              style={{ color: "var(--vera-grey-400)" }}>
              <ChevronIcon />
            </div>
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="reasoning-content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className="pl-3 text-[13px] leading-relaxed whitespace-pre-wrap"
              style={{
                borderLeft: "2px solid var(--vera-grey-200)",
                color: "var(--vera-grey-400)",
              }}
            >
              {text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
