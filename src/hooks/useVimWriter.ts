"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVimOS } from "@/app/page";
import type { EncounterUpdatePayload, CanUpdateEncounterParams } from "@/types/vim";

export type WriteStatus = "idle" | "writing" | "success" | "error";

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
    if (!vimOS?.ehr?.resourceUpdater?.canUpdateEncounter) return;

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
      const result = vimOS.ehr.resourceUpdater.canUpdateEncounter(allFields);
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
        setWritableFields(fields ?? {});
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

  const canWrite = useCallback(
    (section: keyof CanUpdateEncounterParams): boolean => {
      if (!vimOS?.ehr?.resourceUpdater?.updateEncounter) return false;
      const sectionFields = writableFields[section];
      if (!sectionFields) return false;
      // Check if at least one field in the section is writable
      return Object.values(sectionFields).some(Boolean);
    },
    [vimOS, writableFields],
  );

  const writeToEncounter = useCallback(
    async (payload: EncounterUpdatePayload): Promise<void> => {
      if (!vimOS?.ehr?.resourceUpdater?.updateEncounter) {
        throw new Error("updateEncounter not available");
      }
      if (getRemainingWrites() <= 0) {
        throw new Error("Rate limit reached (10 writes/min). Please wait.");
      }

      setWriteStatus("writing");
      try {
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

  return {
    canWrite,
    writeToEncounter,
    writeStatus,
    remainingWrites: getRemainingWrites(),
  };
}
