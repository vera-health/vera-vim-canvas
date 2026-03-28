"use client";

import { useCallback, useRef, useState } from "react";

export function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const recalc = useCallback(() => {
    const wrapper = wrapperRef.current;
    const tip = tipRef.current;
    if (!wrapper || !tip) return;

    const anchor = wrapper.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const vw = window.innerWidth;

    // Vertical: prefer above, fall back to below
    const above = anchor.top - tipRect.height - 6 >= 0;
    const vertical: React.CSSProperties = above
      ? { bottom: "calc(100% + 6px)" }
      : { top: "calc(100% + 6px)" };

    // Horizontal: center, then nudge if clipping
    const centerX = anchor.left + anchor.width / 2 - tipRect.width / 2;
    let horizontal: React.CSSProperties;
    if (centerX < 4) {
      horizontal = { left: 0 };
    } else if (centerX + tipRect.width > vw - 4) {
      horizontal = { right: 0 };
    } else {
      horizontal = { left: "50%", transform: "translateX(-50%)" };
    }

    setStyle({ ...vertical, ...horizontal });
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="group relative inline-flex"
      onMouseEnter={recalc}
    >
      {children}
      <span
        ref={tipRef}
        className="pointer-events-none absolute z-50 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          backgroundColor: "#1a1a1a",
          color: "#fff",
          ...style,
        }}
      >
        {label}
      </span>
    </div>
  );
}
