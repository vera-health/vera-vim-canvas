"use client";

import { useCallback, useEffect, useState } from "react";
import { useVimOS } from "@/app/page";
import type { EncounterUpdatePayload, CanUpdateEncounterParams } from "@/types/vim";

export type WriteStatus = "idle" | "writing" | "success" | "error";
export type WriteAvailability = "available" | "unavailable" | "unknown";

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

// Module-level timestamps shared across all useVimWriter instances
const sharedWriteTimestamps: number[] = [];

export function useVimWriter() {
  const vimOS = useVimOS();
  const [writeStatus, setWriteStatus] = useState<WriteStatus>("idle");
  const [writableFields, setWritableFields] = useState<CanUpdateEncounterParams>({});

  // Check which encounter fields are writable
  useEffect(() => {
    if (!vimOS?.canUpdateEncounter) {
      console.debug("[Vera] canUpdateEncounter not available on vimOS");
      return;
    }

    try {
      const allFields: CanUpdateEncounterParams = {
        subjective: { generalNotes: true, chiefComplaintNotes: true, historyOfPresentIllnessNotes: true, reviewOfSystemsNotes: true },
        objective: { generalNotes: true, physicalExamNotes: true },
        assessment: { generalNotes: true, diagnosisCodes: true },
        plan: { generalNotes: true },
        billingInformation: { procedureCodes: true },
        patientInstructions: { generalNotes: true },
        encounterNotes: { generalNotes: true },
      };
      const result = vimOS.canUpdateEncounter(allFields);
      console.debug("[Vera] canUpdateEncounter result:", result);
      if (result?.details) {
        setWritableFields(result.details);
      }
    } catch {
      // canUpdateEncounter not available — leave empty
    }
  }, [vimOS]);

  // Subscribe to writability changes
  useEffect(() => {
    if (!vimOS?.ehr?.resourceUpdater?.subscribe) return;
    try {
      const unsub = vimOS.ehr.resourceUpdater.subscribe("encounter", (fields) => {
        console.debug("[Vera] resourceUpdater encounter fields:", fields);
        if (fields && typeof fields === "object" && Object.keys(fields).length > 0) {
          setWritableFields(fields);
        }
      });
      return unsub;
    } catch {
      // not available
    }
  }, [vimOS]);

  const getRemainingWrites = useCallback(() => {
    const now = Date.now();
    // Prune expired timestamps in-place
    while (sharedWriteTimestamps.length > 0 && now - sharedWriteTimestamps[0] >= RATE_WINDOW_MS) {
      sharedWriteTimestamps.shift();
    }
    return RATE_LIMIT - sharedWriteTimestamps.length;
  }, []);

  const getWriteAvailability = useCallback(
    (section: keyof CanUpdateEncounterParams): WriteAvailability => {
      if (!vimOS?.updateEncounter) return "unknown";
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
        if (!vimOS?.updateEncounter) {
          throw new Error("updateEncounter not available");
        }
        await vimOS.updateEncounter(payload);
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

  return {
    getWriteAvailability,
    writeToEncounter,
    writeStatus,
    remainingWrites: getRemainingWrites(),
  };
}
