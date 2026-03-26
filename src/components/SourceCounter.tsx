"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

function AnimatedCount({ target }: { target: number }) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (target <= 0) return;
    const duration = 600;
    const start = performance.now();
    const from = current;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target]);

  return <>{current}</>;
}

function SpinnerIcon() {
  return (
    <svg height={14} viewBox="0 0 16 16" width={14} style={{ color: "currentcolor" }}>
      <g clipPath="url(#clip0_src)">
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
        <clipPath id="clip0_src">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function SourceCounter({ count, label }: { count: number; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-center gap-2.5 py-1"
    >
      <div className="flex-shrink-0 animate-spin" style={{ color: "var(--vera-grey-400)" }}>
        <SpinnerIcon />
      </div>
      <span className="text-[13px] tabular-nums" style={{ color: "var(--vera-grey-600)" }}>
        {label} <AnimatedCount target={count} /> sources
      </span>
    </motion.div>
  );
}
