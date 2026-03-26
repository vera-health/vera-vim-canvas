"use client";

import type {ReferenceSchema} from "@/types/references";
import type {EvidenceStrength, EvidenceLevelData} from "@/types/evidence";

import React, {useState, useRef, useEffect} from "react";

// --- Evidence Chip ---

const EVIDENCE_CHIP_STYLES: Record<EvidenceStrength, React.CSSProperties> = {
  "Very High": {backgroundColor: "rgb(13 148 136 / 0.12)", color: "#0f766e"},
  High: {backgroundColor: "rgb(5 150 105 / 0.12)", color: "#047857"},
  Moderate: {backgroundColor: "rgb(217 119 6 / 0.12)", color: "#b45309"},
  Low: {backgroundColor: "rgb(234 88 12 / 0.12)", color: "#c2410c"},
};

const EvidenceChip: React.FC<{strength: EvidenceStrength}> = ({strength}) => (
  <span
    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
    style={EVIDENCE_CHIP_STYLES[strength]}
  >
    {strength}
  </span>
);

// --- Neutral Chip ---

const NeutralChip: React.FC<{children: React.ReactNode; emphasis?: boolean}> = ({
  children,
  emphasis,
}) => (
  <span
    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
    style={{
      backgroundColor: "rgb(72 96 129 / 0.08)",
      color: "#486081",
      fontWeight: emphasis ? 600 : 400,
    }}
  >
    {children}
  </span>
);

// --- Reference Card (simplified for puebla) ---

function getRefUrl(ref: ReferenceSchema): string | undefined {
  if (ref.pmid) return `https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}`;
  if (ref.doi) return `https://doi.org/${ref.doi}`;
  return ref.url;
}

const TooltipReferenceCard: React.FC<{
  reference: ReferenceSchema;
  evidenceStrength?: EvidenceStrength | null;
  evidenceData?: EvidenceLevelData | null;
}> = ({reference, evidenceStrength, evidenceData}) => {
  const url = getRefUrl(reference);

  return (
    <div className="space-y-1.5">
      {reference.title && (
        <a
          className="block text-sm font-medium hover:underline"
          style={{color: "#37475E"}}
          href={url || "#"}
          target="_blank"
          rel="noopener noreferrer"
        >
          {reference.title}
        </a>
      )}

      <div className="flex flex-wrap items-center gap-1.5 text-xs" style={{color: "#687076"}}>
        {(reference.publicationVenue?.name || reference.journal) && (
          <span className="max-w-[60%] truncate italic">
            {reference.publicationVenue?.name || reference.journal}
          </span>
        )}
        {(reference.publicationVenue?.name || reference.journal) &&
          (reference.first_author || reference.authors?.[0] || reference.year) && (
            <span
              className="inline-block h-1 w-1 rounded-full"
              style={{backgroundColor: "#CBD5E0"}}
            />
          )}
        {(reference.authors?.[0] || reference.first_author) && (
          <span>
            {(reference.authors?.[0]?.name || reference.first_author || "").split(" ").pop()} et al.
          </span>
        )}
        {(reference.authors?.[0] || reference.first_author) && reference.year && (
          <span
            className="inline-block h-1 w-1 rounded-full"
            style={{backgroundColor: "#CBD5E0"}}
          />
        )}
        {reference.year && <span>{reference.year}</span>}
      </div>

      {(evidenceStrength || evidenceData?.study_characteristics) && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {evidenceStrength && <EvidenceChip strength={evidenceStrength} />}
          {evidenceData?.study_characteristics?.design && (
            <NeutralChip emphasis>
              <span className="capitalize">{evidenceData.study_characteristics.design}</span>
            </NeutralChip>
          )}
          {evidenceData?.study_characteristics && !evidenceData.study_characteristics.design?.toLowerCase().includes("guideline") && (
            <>
              {evidenceData.study_characteristics.oxford_level && (
                <NeutralChip>
                  Oxford: <span className="font-semibold">{evidenceData.study_characteristics.oxford_level}</span>
                </NeutralChip>
              )}
              {evidenceData.study_characteristics.sample_size != null && (
                <NeutralChip>
                  N = <span className="font-semibold">{evidenceData.study_characteristics.sample_size.toLocaleString()}</span>
                </NeutralChip>
              )}
              {evidenceData.study_characteristics.follow_up_duration && (
                <NeutralChip>
                  Follow-up: <span className="font-semibold">{evidenceData.study_characteristics.follow_up_duration}</span>
                </NeutralChip>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// --- Global Tooltip State ---

type TooltipState = {
  reference: ReferenceSchema | null;
  evidenceStrength?: EvidenceStrength | null;
  evidenceData?: EvidenceLevelData | null;
  position: {x: number; y: number; triggerHeight: number};
  visible: boolean;
};

let globalTooltipState: TooltipState = {
  reference: null,
  position: {x: 0, y: 0, triggerHeight: 0},
  visible: false,
};

let globalSetTooltipState: ((state: TooltipState) => void) | null = null;
let globalTooltipTimeout: NodeJS.Timeout | null = null;

// --- Tooltip Display Component ---
// Mount this ONCE in a parent container (e.g. ChatView)
export const ReferenceTooltipDisplay: React.FC = () => {
  const [state, setState] = useState<TooltipState>(globalTooltipState);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    globalSetTooltipState = setState;

    const handleScroll = () => {
      if (globalTooltipState.visible && globalSetTooltipState) {
        const newState = {...globalTooltipState, visible: false};
        globalTooltipState = newState;
        globalSetTooltipState(newState);
      }
    };

    window.addEventListener("scroll", handleScroll, true);

    return () => {
      globalSetTooltipState = null;
      globalTooltipState = {...globalTooltipState, visible: false};
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState<{left: number; top: number} | null>(null);

  // Re-adjust position whenever the tooltip becomes visible or position changes
  useEffect(() => {
    if (!state.visible || !state.reference) {
      setAdjustedPos(null);
      return;
    }

    // Use a rAF to measure after the browser has laid out the tooltip
    const id = requestAnimationFrame(() => {
      const el = tooltipRef.current;
      if (!el) return;

      const TOOLTIP_WIDTH = 340;
      const PADDING = 8;
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Start centered above the trigger
      let left = state.position.x - TOOLTIP_WIDTH / 2;
      let top = state.position.y - rect.height - PADDING;

      // Clamp horizontal: keep fully within viewport
      if (left < PADDING) left = PADDING;
      if (left + TOOLTIP_WIDTH > vw - PADDING) left = vw - PADDING - TOOLTIP_WIDTH;

      // If not enough room above, show below the trigger instead
      if (top < PADDING) {
        top = state.position.y + state.position.triggerHeight + PADDING;
      }

      // Clamp bottom
      if (top + rect.height > vh - PADDING) {
        top = vh - PADDING - rect.height;
      }

      setAdjustedPos({left, top});
    });

    return () => cancelAnimationFrame(id);
  }, [state.visible, state.position.x, state.position.y, state.reference]);

  if (!mounted || !state.visible || !state.reference) return null;

  return (
    <div
      ref={tooltipRef}
      className="pointer-events-auto fixed z-[9999] w-[340px] rounded-lg border p-3 shadow-md"
      style={{
        left: adjustedPos?.left ?? state.position.x,
        top: adjustedPos?.top ?? state.position.y,
        maxHeight: "80vh",
        overflowY: "auto",
        backgroundColor: "#F9FAFB",
        borderColor: "#E5E7EB",
        // Hide until positioned to prevent flash at wrong location
        visibility: adjustedPos ? "visible" : "hidden",
      }}
      onMouseEnter={() => {
        if (globalTooltipTimeout) {
          clearTimeout(globalTooltipTimeout);
          globalTooltipTimeout = null;
        }
      }}
      onMouseLeave={() => {
        if (globalSetTooltipState) {
          globalSetTooltipState({...state, visible: false});
        }
      }}
    >
      <TooltipReferenceCard
        reference={state.reference}
        evidenceStrength={state.evidenceStrength}
        evidenceData={state.evidenceData}
      />
    </div>
  );
};

// --- Trigger Component ---

interface ReferenceTooltipProps {
  reference: ReferenceSchema | undefined;
  evidenceStrength?: EvidenceStrength | null;
  evidenceData?: EvidenceLevelData | null;
  children: React.ReactNode;
}

const ReferenceTooltip: React.FC<ReferenceTooltipProps> = ({
  reference,
  evidenceStrength,
  evidenceData,
  children,
}) => {
  const triggerRef = useRef<HTMLSpanElement>(null);

  if (!reference) {
    return <>{children}</>;
  }

  const handleMouseEnter = () => {
    if (globalTooltipTimeout) {
      clearTimeout(globalTooltipTimeout);
      globalTooltipTimeout = null;
    }

    if (triggerRef.current && globalSetTooltipState) {
      const rect = triggerRef.current.getBoundingClientRect();

      const newState: TooltipState = {
        reference,
        evidenceStrength,
        evidenceData,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top,
          triggerHeight: rect.height,
        },
        visible: true,
      };

      globalTooltipState = newState;
      globalSetTooltipState(newState);
    }
  };

  const handleMouseLeave = () => {
    globalTooltipTimeout = setTimeout(() => {
      if (globalSetTooltipState) {
        const newState = {...globalTooltipState, visible: false};
        globalTooltipState = newState;
        globalSetTooltipState(newState);
      }
    }, 100);
  };

  return (
    <span ref={triggerRef} onMouseOver={handleMouseEnter} onMouseOut={handleMouseLeave}>
      {children}
    </span>
  );
};

export default ReferenceTooltip;
