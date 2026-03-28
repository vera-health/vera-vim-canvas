"use client";

import React from "react";

export const AshpLinkButton: React.FC = () => {
  return (
    <button
      className="font-normal italic hover:underline"
      style={{ color: "#1b779b" }}
      type="button"
      onClick={() => {
        const tabEvent = new CustomEvent("switchToDrugTab", {detail: true});
        window.dispatchEvent(tabEvent);
      }}
    >
      ASHP
    </button>
  );
};
