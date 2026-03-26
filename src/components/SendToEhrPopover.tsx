"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileOutput, Check, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { useVimWriter, type EhrSection, type WriteStatus } from "@/hooks/useVimWriter";

/** Human-readable labels for each SOAP / encounter section */
const SECTION_OPTIONS: { key: EhrSection; label: string }[] = [
  { key: "subjective", label: "Subjective" },
  { key: "objective", label: "Objective" },
  { key: "assessment", label: "Assessment" },
  { key: "plan", label: "Plan" },
];

interface PopoverPosition {
  top: number;
  left: number;
}

/**
 * Floating popover that appears when the user selects text inside an assistant
 * message. Offers "Send to EHR" → section picker → writes to encounter.
 *
 * Mount this once inside the scrollable messages container, passing the
 * container ref so we can compute positions relative to it.
 */
export function SendToEhrPopover({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const { getWriteAvailability, writeToEncounter, writeStatus, buildSectionPayload } = useVimWriter();
  const [selectedText, setSelectedText] = useState("");
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const [showSections, setShowSections] = useState(false);
  const [lastWriteStatus, setLastWriteStatus] = useState<WriteStatus>("idle");
  const [lastSection, setLastSection] = useState<EhrSection | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Track write status for the feedback icons
  useEffect(() => {
    setLastWriteStatus(writeStatus);
  }, [writeStatus]);

  // Listen for selection changes
  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      // Only clear if we're not showing sections (let user finish picking)
      if (!showSections && lastWriteStatus === "idle") {
        setSelectedText("");
        setPosition(null);
      }
      return;
    }

    const text = sel.toString().trim();
    if (!text) return;

    // Check that selection is inside an assistant message (not user bubble)
    const range = sel.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    const el = ancestor instanceof Element ? ancestor : ancestor.parentElement;
    if (!el) return;

    // Walk up to find .vera-prose (assistant message container)
    const isInsideAssistant = el.closest(".vera-prose");
    if (!isInsideAssistant) return;

    // Compute position relative to the scroll container
    const container = containerRef.current;
    if (!container) return;

    const rangeRect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setSelectedText(text);
    setPosition({
      top: rangeRect.top - containerRect.top + container.scrollTop - 40,
      left: Math.min(
        Math.max(rangeRect.left - containerRect.left + rangeRect.width / 2, 20),
        containerRect.width - 20,
      ),
    });
  }, [containerRef, showSections, lastWriteStatus]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  // Close popover on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowSections(false);
        setSelectedText("");
        setPosition(null);
        setLastSection(null);
      }
    }
    if (position) {
      // Delay to avoid the click that created the selection from immediately closing
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClick);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClick);
      };
    }
  }, [position]);

  // Reset after success/error feedback
  useEffect(() => {
    if (lastWriteStatus === "success") {
      const timer = setTimeout(() => {
        setSelectedText("");
        setPosition(null);
        setShowSections(false);
        setLastSection(null);
      }, 1200);
      return () => clearTimeout(timer);
    }
    if (lastWriteStatus === "error") {
      const timer = setTimeout(() => {
        setLastSection(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastWriteStatus]);

  const handleSendToSection = async (section: EhrSection) => {
    if (!selectedText || writeStatus !== "idle") return;
    setLastSection(section);
    try {
      const payload = buildSectionPayload(section, selectedText);
      await writeToEncounter(payload);
      // Clear selection
      window.getSelection()?.removeAllRanges();
    } catch (err) {
      console.error("[Vera] Failed to send selection to EHR:", err);
    }
  };

  if (!position || !selectedText) return null;

  // Check if any SOAP section is available
  const anySectionAvailable = SECTION_OPTIONS.some(
    (s) => getWriteAvailability(s.key) !== "unavailable",
  );

  if (!anySectionAvailable) return null;

  const statusIcon = (section: EhrSection) => {
    if (lastSection !== section) return null;
    switch (lastWriteStatus) {
      case "writing":
        return <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#687076" }} />;
      case "success":
        return <Check className="h-3.5 w-3.5" style={{ color: "#1b779b" }} />;
      case "error":
        return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute z-50"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
      }}
    >
      {!showSections ? (
        /* ── Primary button ── */
        <button
          type="button"
          onClick={() => setShowSections(true)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-lg transition-colors hover:bg-gray-50"
          style={{
            backgroundColor: "#fff",
            color: "#37475E",
            border: "1px solid #E2E8F0",
            fontFamily: "Manrope, system-ui, sans-serif",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          <FileOutput className="h-3.5 w-3.5" style={{ color: "#687076" }} />
          Send to EHR
          <ChevronRight className="h-3 w-3" style={{ color: "#A0AEC0" }} />
        </button>
      ) : (
        /* ── Section picker ── */
        <div
          className="rounded-xl py-1 shadow-lg"
          style={{
            backgroundColor: "#fff",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            minWidth: 160,
          }}
        >
          <div
            className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "#8090A6", fontFamily: "Manrope, system-ui, sans-serif" }}
          >
            Send to section
          </div>
          {SECTION_OPTIONS.map(({ key, label }) => {
            const avail = getWriteAvailability(key);
            const disabled = avail === "unavailable" || (writeStatus !== "idle" && lastSection === key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSendToSection(key)}
                disabled={disabled}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs transition-colors hover:bg-gray-50 disabled:opacity-40"
                style={{
                  color: "#37475E",
                  fontFamily: "Manrope, system-ui, sans-serif",
                }}
              >
                <span>{label}</span>
                {statusIcon(key)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
