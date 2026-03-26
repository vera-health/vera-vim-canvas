"use client";

import type {EvidenceStrength} from "@/types/evidence";
import type {ReferenceSchema} from "@/types/references";

import React from "react";

import {sanitizeUrl} from "@/components/renderers/utils";

// Evidence colors matching mobile: vera-mobile tailwind.config.js evidence scale
const EVIDENCE_STYLES: Record<EvidenceStrength, React.CSSProperties> = {
  "Very High": { backgroundColor: "rgb(13 148 136 / 0.12)", color: "#0f766e" },
  High: { backgroundColor: "rgb(5 150 105 / 0.12)", color: "#047857" },
  Moderate: { backgroundColor: "rgb(217 119 6 / 0.12)", color: "#b45309" },
  Low: { backgroundColor: "rgb(234 88 12 / 0.12)", color: "#c2410c" },
};

const NONE_STYLE: React.CSSProperties = {
  backgroundColor: "rgb(72 96 129 / 0.10)",
  color: "#486081",
};

interface CitationLinkProps {
  reference: ReferenceSchema | undefined;
  href: string | undefined;
  citationNumber: number;
  evidenceStrength?: EvidenceStrength | null;
}

export const CitationLink: React.FC<CitationLinkProps> = ({
  reference,
  href,
  citationNumber,
  evidenceStrength,
}) => {
  const colorStyle =
    evidenceStrength && EVIDENCE_STYLES[evidenceStrength]
      ? EVIDENCE_STYLES[evidenceStrength]
      : NONE_STYLE;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (reference) {
      // Open the reference URL
      const url =
        reference.pmid
          ? `https://pubmed.ncbi.nlm.nih.gov/${reference.pmid}`
          : reference.doi
            ? `https://doi.org/${reference.doi}`
            : reference.url;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } else {
      const safeUrl = sanitizeUrl(href);
      if (safeUrl) window.open(safeUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      className="not-prose inline-flex items-center align-middle ml-0.5"
      title={reference?.title}
      onClick={handleClick}
    >
      <span
        className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded px-1 text-[10px] font-semibold leading-none"
        style={{...colorStyle, fontFamily: "system-ui, sans-serif"}}
      >
        {citationNumber}
      </span>
    </button>
  );
};
