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
        await vimOS.ehr.resourceUpdater.updateEncounter(payload);
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
