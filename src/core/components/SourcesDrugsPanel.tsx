"use client";

import { useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { X, BookOpen, Pill, ExternalLink } from "lucide-react";
import type { ReferenceSchema } from "@/core/types/references";
import type { EvidenceStrength, EvidenceLevelData } from "@/core/types/evidence";
import type { VeraBlockContent } from "@/core/types/customAST";
import { CustomASTRenderer } from "@/core/components/renderers";

interface SourcesDrugsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: "sources" | "drugs";
  onTabChange: (tab: "sources" | "drugs") => void;
  references: ReferenceSchema[];
  evidenceLevels?: Record<string, EvidenceLevelData>;
  drugNodes: { type: "root"; children: VeraBlockContent[] }[];
  showDrugsTab: boolean;
}

function getReferenceUrl(ref: ReferenceSchema): string | undefined {
  if (ref.url) return ref.url;
  if (ref.doi) return `https://doi.org/${ref.doi}`;
  if (ref.pmid) return `https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}`;
  return undefined;
}

function getEvidenceForRef(
  ref: ReferenceSchema,
  levels?: Record<string, EvidenceLevelData>,
): EvidenceLevelData | undefined {
  if (!levels) return undefined;
  // Keys match CustomASTRenderer: raw doi and pmid, not full URLs
  const keys = [
    ref.doi,
    ref.pmid,
    ref.url,
    ref.paperId,
    ref.id,
  ].filter(Boolean) as string[];
  for (const key of keys) {
    if (levels[key]) return levels[key];
  }
  return undefined;
}

function formatAuthors(ref: ReferenceSchema): string {
  if (ref.authors && ref.authors.length > 0) {
    const names = ref.authors.map((a) => a.name);
    if (names.length <= 3) return names.join(", ");
    return `${names[0]} et al.`;
  }
  if (ref.first_author) return ref.first_author;
  return "";
}

// --- Evidence UI (matches ReferenceTooltip patterns) ---

const EVIDENCE_CHIP_STYLES: Record<EvidenceStrength, React.CSSProperties> = {
  "Very High": { backgroundColor: "rgb(6 95 70 / 0.25)", color: "#065f46" },
  High: { backgroundColor: "rgb(5 150 105 / 0.12)", color: "#047857" },
  Moderate: { backgroundColor: "rgb(217 119 6 / 0.12)", color: "#b45309" },
  Low: { backgroundColor: "rgb(234 88 12 / 0.12)", color: "#c2410c" },
};

function EvidenceChip({ strength }: { strength: EvidenceStrength }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ ...EVIDENCE_CHIP_STYLES[strength], fontFamily: "Manrope, system-ui, sans-serif" }}
    >
      {strength}
    </span>
  );
}

function NeutralChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px]"
      style={{
        backgroundColor: "rgb(72 96 129 / 0.08)",
        color: "#486081",
        fontFamily: "Manrope, system-ui, sans-serif",
      }}
    >
      {children}
    </span>
  );
}

function Dot() {
  return (
    <span
      className="inline-block h-1 w-1 shrink-0 rounded-full"
      style={{ backgroundColor: "#CBD5E0" }}
    />
  );
}

// --- Source Card ---

function SourceCard({
  reference,
  index,
  evidenceData,
}: {
  reference: ReferenceSchema;
  index: number;
  evidenceData?: EvidenceLevelData;
}) {
  const url = getReferenceUrl(reference);
  const authors = formatAuthors(reference);
  const journal = reference.publicationVenue?.name || reference.journal;
  const strength = evidenceData?.overall_strength;
  const study = evidenceData?.study_characteristics;
  const isGuideline = study?.design?.toLowerCase().includes("guideline");

  return (
    <div
      className="rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50"
      style={{ borderBottom: "1px solid #EDF2F7" }}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-medium"
          style={{ backgroundColor: "#EDF1F5", color: "#687076" }}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          {/* Title */}
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium leading-snug hover:underline"
              style={{ color: "#37475E" }}
            >
              {reference.title || "Untitled reference"}
              <ExternalLink className="ml-1 inline h-3 w-3" style={{ color: "#8090A6" }} />
            </a>
          ) : (
            <span className="text-sm font-medium leading-snug" style={{ color: "#37475E" }}>
              {reference.title || "Untitled reference"}
            </span>
          )}

          {/* Journal, authors, year */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs" style={{ color: "#687076" }}>
            {journal && <span className="max-w-[60%] truncate italic">{journal}</span>}
            {journal && (authors || reference.year) && <Dot />}
            {authors && <span>{authors}</span>}
            {authors && reference.year && <Dot />}
            {reference.year && <span>{reference.year}</span>}
          </div>

          {/* Evidence chips */}
          {(strength || study) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {strength && <EvidenceChip strength={strength} />}
              {study?.design && (
                <NeutralChip>
                  <span className="capitalize">{study.design}</span>
                </NeutralChip>
              )}
              {study && !isGuideline && (
                <>
                  {study.oxford_level && (
                    <NeutralChip>
                      Oxford: <span className="">{study.oxford_level}</span>
                    </NeutralChip>
                  )}
                  {study.sample_size != null && (
                    <NeutralChip>
                      N = <span className="">{study.sample_size.toLocaleString()}</span>
                    </NeutralChip>
                  )}
                  {study.follow_up_duration && (
                    <NeutralChip>
                      Follow-up: <span className="">{study.follow_up_duration}</span>
                    </NeutralChip>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sources List ---

function SourcesList({
  references,
  evidenceLevels,
}: {
  references: ReferenceSchema[];
  evidenceLevels?: Record<string, EvidenceLevelData>;
}) {
  if (references.length === 0) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: "#8090A6" }}>
        No sources available
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {references.map((reference, i) => (
        <SourceCard
          key={reference.id || reference.pmid || i}
          reference={reference}
          index={i}
          evidenceData={getEvidenceForRef(reference, evidenceLevels)}
        />
      ))}
    </div>
  );
}

// --- Drugs List ---

function DrugsList({ drugNodes }: { drugNodes: { type: "root"; children: VeraBlockContent[] }[] }) {
  if (drugNodes.length === 0) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: "#8090A6" }}>
        No drug information available
      </p>
    );
  }

  return (
    <div
      className="space-y-4 text-sm leading-relaxed vera-prose"
      style={{ color: "#37475E", fontFamily: "Manrope, system-ui, sans-serif" }}
    >
      {drugNodes.map((node, i) => (
        <CustomASTRenderer key={i} ast={node} isStreaming={false} />
      ))}
    </div>
  );
}

// --- Main Panel ---

export function SourcesDrugsPanel({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  references,
  evidenceLevels,
  drugNodes,
  showDrugsTab,
}: SourcesDrugsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350, mass: 0.8 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl"
            style={{
              height: "85vh",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing">
              <div
                className="h-1 w-8 rounded-full"
                style={{ backgroundColor: "#D1D5DB" }}
              />
            </div>

            {/* Tab bar */}
            <LayoutGroup>
              <div
                className="flex items-center justify-between px-4 pb-3"
                style={{ borderBottom: "1px solid #EDF2F7" }}
              >
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onTabChange("sources")}
                    className="relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium"
                    style={{
                      color: activeTab === "sources" ? "#37475E" : "#8090A6",
                    }}
                  >
                    {activeTab === "sources" && (
                      <motion.div
                        layoutId="panel-tab-indicator"
                        className="absolute inset-0 rounded-lg"
                        style={{ backgroundColor: "#EDF1F5" }}
                        transition={{ type: "spring", damping: 30, stiffness: 400 }}
                      />
                    )}
                    <BookOpen className="relative h-4 w-4" />
                    <span className="relative">Sources ({references.length})</span>
                  </button>
                  {showDrugsTab && (
                    <button
                      type="button"
                      onClick={() => onTabChange("drugs")}
                      className="relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium"
                      style={{
                        color: activeTab === "drugs" ? "#155f7c" : "#8090A6",
                      }}
                    >
                      {activeTab === "drugs" && (
                        <motion.div
                          layoutId="panel-tab-indicator"
                          className="absolute inset-0 rounded-lg"
                          style={{ backgroundColor: "#e3eef3" }}
                          transition={{ type: "spring", damping: 30, stiffness: 400 }}
                        />
                      )}
                      <Pill className="relative h-4 w-4" />
                      <span className="relative">Drugs ({drugNodes.length})</span>
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                  style={{ color: "#687076" }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </LayoutGroup>

            {/* Tab content */}
            <div className="min-h-0 overflow-y-auto">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-4 py-3"
                >
                  {activeTab === "sources" ? (
                    <SourcesList references={references} evidenceLevels={evidenceLevels} />
                  ) : (
                    <DrugsList drugNodes={drugNodes} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
