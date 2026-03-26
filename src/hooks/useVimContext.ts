"use client";

import { useCallback, useEffect, useState } from "react";
import { useVimOS } from "@/app/page";
import type {
  VimEhrPatient,
  VimEhrEncounter,
  VimDiagnosis,
  VimMedication,
} from "@/types/vim";

export interface VimContextValue {
  patient: VimEhrPatient | null;
  encounter: VimEhrEncounter | null;
  problems: VimDiagnosis[];
  medications: VimMedication[];
}

export function useVimContext(): VimContextValue {
  const vimOS = useVimOS();
  const [patient, setPatient] = useState<VimEhrPatient | null>(null);
  const [encounter, setEncounter] = useState<VimEhrEncounter | null>(null);
  const [problems, setProblems] = useState<VimDiagnosis[]>([]);
  const [medications, setMedications] = useState<VimMedication[]>([]);

  const loadLists = useCallback(async (p: VimEhrPatient | null) => {
    if (!p) {
      setProblems([]);
      setMedications([]);
      return;
    }
    // Each call wrapped individually — one failure shouldn't block the other
    try {
      if (typeof p.getProblemList === "function") {
        const list = await p.getProblemList();
        setProblems(Array.isArray(list) ? list : []);
      }
    } catch {
      setProblems([]);
    }
    try {
      if (typeof p.getMedicationList === "function") {
        const list = await p.getMedicationList();
        setMedications(Array.isArray(list) ? list : []);
      }
    } catch {
      setMedications([]);
    }
  }, []);

  useEffect(() => {
    if (!vimOS?.ehr) return;

    const ehr = vimOS.ehr;
    console.log("[Vera] VimOS ehr keys:", Object.keys(ehr));

    // ---- Initial values from ehrState ----
    try {
      const initialPatient = ehr.ehrState?.patient ?? null;
      setPatient(initialPatient);
      loadLists(initialPatient);
    } catch {
      // ehrState may not exist — stay null
    }

    try {
      setEncounter(ehr.ehrState?.encounter ?? null);
    } catch {
      // stay null
    }

    // ---- Subscriptions for live updates ----
    const unsubs: Array<() => void> = [];

    const onPatient = (p: VimEhrPatient | null) => {
      setPatient(p);
      loadLists(p);
    };

    const onEncounter = (e: VimEhrEncounter | null) => {
      setEncounter(e);
    };

    try {
      if (typeof ehr.subscribe === "function") {
        ehr.subscribe("patient", onPatient);
        unsubs.push(() => {
          try {
            ehr.unsubscribe("patient", onPatient);
          } catch { /* ignore */ }
        });

        ehr.subscribe("encounter", onEncounter);
        unsubs.push(() => {
          try {
            ehr.unsubscribe("encounter", onEncounter);
          } catch { /* ignore */ }
        });
      }
    } catch {
      // subscribe not available — rely on initial values
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [vimOS, loadLists]);

  return { patient, encounter, problems, medications };
}
