"use client";

import React from "react";

interface LOEBadgeProps {
  level: string;
}

// Mobile evidence marker colors: Level I = green, II = orange, III = red
const LEVEL_STYLES: Record<string, React.CSSProperties> = {
  I: { backgroundColor: "rgba(46, 125, 50, 0.15)", color: "#2E7D32" },
  II: { backgroundColor: "rgba(239, 108, 0, 0.15)", color: "#EF6C00" },
  III: { backgroundColor: "rgba(198, 40, 40, 0.15)", color: "#C62828" },
};

export const LOEBadge: React.FC<LOEBadgeProps> = ({level}) => {
  const style = LEVEL_STYLES[level] || LEVEL_STYLES["II"];

  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold"
      style={style}
      title={`Level of Evidence: ${level}`}
    >
      {level}
    </span>
  );
};
