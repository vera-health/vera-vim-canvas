"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { ThinkingStep } from "@/types/chat";

function AnimatedNumber({ target }: { target: number }) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef(0);

  useEffect(() => {
    if (target <= 0) return;
    const duration = 800;
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

function StepText({ text, isActive }: { text: string; isActive: boolean }) {
  const match = text.match(/(\d+)/);
  if (match && isActive) {
    const num = parseInt(match[1], 10);
    const parts = text.split(match[0]);
    return (
      <>
        {parts[0]}<AnimatedNumber target={num} />{parts.slice(1).join(match[0])}
      </>
    );
  }
  return <>{text}</>;
}

export default function ThinkingStepRow({ step }: { step: ThinkingStep }) {
  const isActive = step.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="py-1"
    >
      <span
        className={`text-[13px] ${isActive ? "shimmer-text" : ""}`}
        style={!isActive ? { color: "var(--vera-grey-400)" } : undefined}
      >
        <StepText text={step.text} isActive={isActive} />
      </span>
    </motion.div>
  );
}
