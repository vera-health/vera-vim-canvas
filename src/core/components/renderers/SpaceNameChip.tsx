"use client";

import React from "react";

interface SpaceNameChipProps {
  name: string;
}

// Matches mobile: border-secondary-200 bg-secondary-100 text-secondary-700
export const SpaceNameChip: React.FC<SpaceNameChipProps> = ({name}) => {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{
        borderColor: "#9dd4d4",
        backgroundColor: "#d9f0f0",
        color: "#1a7f7e",
      }}
    >
      {name}
    </span>
  );
};
