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

export function SourceCounter({ count, label }: { count: number; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="py-1"
    >
      <span className="text-[13px] tabular-nums shimmer-text">
        {label} <AnimatedCount target={count} /> sources
      </span>
    </motion.div>
  );
}
