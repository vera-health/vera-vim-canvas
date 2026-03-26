"use client";

import { useCallback, useEffect, useState } from "react";
import { useVimOS } from "@/app/page";
import type { EncounterUpdatePayload, CanUpdateEncounterParams } from "@/types/vim";

export type WriteStatus = "idle" | "writing" | "success" | "error";
export type WriteAvailability = "available" | "unavailable" | "unknown";

/** SOAP + other encounter sections the user can target */
export type EhrSection = keyof CanUpdateEncounterParams;

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const MAX_TEXT_LENGTH = 60_000;

/** Unicode → ASCII replacements for EHR-safe text */
const CHAR_MAP: Record<string, string> = {
  "\u2018": "'", "\u2019": "'", "\u201C": '"', "\u201D": '"', // smart quotes
  "\u2013": "-", "\u2014": "-",                                // en/em dash
  "\u2026": "...",                                             // ellipsis
  "\u2022": "-", "\u2023": "-", "\u25E6": "-", "\u25AA": "-", // bullets
  "\u00A0": " ",                                               // non-breaking space
  "\u200B": "",  "\u200C": "",  "\u200D": "",  "\uFEFF": "",  // zero-width chars
  "\u00B0": " degrees ",                                       // degree symbol
  "\u00BD": "1/2", "\u00BC": "1/4", "\u00BE": "3/4",         // fractions
  "\u00B1": "+/-",                                             // plus-minus
  "\u2265": ">=", "\u2264": "<=", "\u2260": "!=",             // math comparisons
  "\u03B1": "alpha", "\u03B2": "beta", "\u03BC": "mu",       // common Greek letters
};

const CHAR_REGEX = new RegExp(Object.keys(CHAR_MAP).join("|"), "g");

/** Recursively sanitize all string values in an encounter payload */
function sanitizePayload(payload: EncounterUpdatePayload): EncounterUpdatePayload {
  const result: Record<string, unknown> = {};
  for (const [section, fields] of Object.entries(payload)) {
    if (fields && typeof fields === "object") {
      const sanitizedFields: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields as Record<string, unknown>)) {
        sanitizedFields[key] = typeof value === "string" ? sanitizeForEhr(value) : value;
      }
      result[section] = sanitizedFields;
    } else {
      result[section] = fields;
    }
  }
  return result as EncounterUpdatePayload;
}

function sanitizeForEhr(text: string): string {
  let s = text.replace(CHAR_REGEX, (ch) => CHAR_MAP[ch]);
  // Strip any remaining non-ASCII (keep printable ASCII + newlines/tabs)
  s = s.replace(/[^\x20-\x7E\n\r\t]/g, "");
  // Collapse runs of blank lines into a single blank line
  s = s.replace(/\n{3,}/g, "\n\n");
  // Trim trailing whitespace per line
  s = s.replace(/[ \t]+$/gm, "");
  return s.trim().slice(0, MAX_TEXT_LENGTH);
}

// Module-level timestamps shared across all useVimWriter instances
const sharedWriteTimestamps: number[] = [];

const ALL_FIELDS: CanUpdateEncounterParams = {
  subjective: { generalNotes: true, chiefComplaintNotes: true, historyOfPresentIllnessNotes: true, reviewOfSystemsNotes: true },
  objective: { generalNotes: true, physicalExamNotes: true },
  assessment: { generalNotes: true, diagnosisCodes: true },
  plan: { generalNotes: true },
  billingInformation: { procedureCodes: true },
  patientInstructions: { generalNotes: true },
  encounterNotes: { generalNotes: true },
};

export function useVimWriter() {
  const vimOS = useVimOS();
  const [writeStatus, setWriteStatus] = useState<WriteStatus>("idle");
  const [writableFields, setWritableFields] = useState<CanUpdateEncounterParams>({});

  // Helper: re-check writability via canUpdateEncounter
  const refreshWritability = useCallback(() => {
    if (!vimOS?.ehr?.resourceUpdater?.canUpdateEncounter) return;
    try {
      const result = vimOS.ehr.resourceUpdater.canUpdateEncounter(ALL_FIELDS);
      console.debug("[Vera] canUpdateEncounter result:", result);
      if (result?.details) {
        setWritableFields(result.details);
      }
    } catch {
      // canUpdateEncounter not available
    }
  }, [vimOS]);

  // Initial check
  useEffect(() => {
    refreshWritability();
  }, [refreshWritability]);

  // Subscribe to writability changes — re-call canUpdateEncounter on every callback
  // (matches demo app pattern: subscribe as trigger, then re-check)
  useEffect(() => {
    if (!vimOS?.ehr?.resourceUpdater?.subscribe) return;
    try {
      const unsub = vimOS.ehr.resourceUpdater.subscribe("encounter", () => {
        refreshWritability();
      });
      return unsub;
    } catch {
      // not available
    }
  }, [vimOS, refreshWritability]);

  const getRemainingWrites = useCallback(() => {
    const now = Date.now();
    while (sharedWriteTimestamps.length > 0 && now - sharedWriteTimestamps[0] >= RATE_WINDOW_MS) {
      sharedWriteTimestamps.shift();
    }
    return RATE_LIMIT - sharedWriteTimestamps.length;
  }, []);

  const getWriteAvailability = useCallback(
    (section: EhrSection): WriteAvailability => {
      if (!vimOS?.ehr?.resourceUpdater?.updateEncounter) return "unknown";
      const sectionFields = writableFields[section];
      if (!sectionFields) return "unknown";
      return Object.values(sectionFields).some(Boolean) ? "available" : "unavailable";
    },
    [vimOS, writableFields],
  );

  const writeToEncounter = useCallback(
    async (payload: EncounterUpdatePayload): Promise<void> => {
      if (getRemainingWrites() <= 0) {
        setWriteStatus("error");
        setTimeout(() => setWriteStatus("idle"), 3000);
        throw new Error("Rate limit reached (10 writes/min). Please wait.");
      }

      setWriteStatus("writing");
      try {
        if (!vimOS?.ehr?.resourceUpdater?.updateEncounter) {
          throw new Error("updateEncounter not available");
        }
        const sanitized = sanitizePayload(payload);
        await vimOS.ehr.resourceUpdater.updateEncounter(sanitized);
        sharedWriteTimestamps.push(Date.now());
        setWriteStatus("success");
        setTimeout(() => setWriteStatus("idle"), 2000);
      } catch (err) {
        setWriteStatus("error");
        setTimeout(() => setWriteStatus("idle"), 3000);
        throw err;
      }
    },
    [vimOS, getRemainingWrites],
  );

  /** Build an EncounterUpdatePayload targeting generalNotes for a given SOAP section */
  const buildSectionPayload = useCallback(
    (section: EhrSection, text: string): EncounterUpdatePayload => {
      switch (section) {
        case "subjective":
          return { subjective: { generalNotes: text } };
        case "objective":
          return { objective: { generalNotes: text } };
        case "assessment":
          return { assessment: { generalNotes: text } };
        case "plan":
          return { plan: { generalNotes: text } };
        case "patientInstructions":
          return { patientInstructions: { generalNotes: text } };
        case "encounterNotes":
          return { encounterNotes: { generalNotes: text } };
        default:
          return { encounterNotes: { generalNotes: text } };
      }
    },
    [],
  );

  return {
    getWriteAvailability,
    writeToEncounter,
    writeStatus,
    remainingWrites: getRemainingWrites(),
    buildSectionPayload,
  };
}
