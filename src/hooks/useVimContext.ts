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
    console.log("[Vera] loadLists called, patient:", p ? "present" : "null");
    if (!p) {
      setProblems([]);
      setMedications([]);
      return;
    }
    // Each call wrapped individually — one failure shouldn't block the other
    try {
      if (typeof p.getProblemList === "function") {
        const list = await p.getProblemList();
        console.log("[Vera] Problem list result:", JSON.stringify(list, null, 2));
        setProblems(Array.isArray(list) ? list : []);
      } else {
        console.log("[Vera] getProblemList is not a function, type:", typeof p.getProblemList);
      }
    } catch (e) {
      console.error("[Vera] Error fetching problem list:", e);
      setProblems([]);
    }
    try {
      if (typeof p.getMedicationList === "function") {
        const list = await p.getMedicationList();
        console.log("[Vera] Medication list result:", JSON.stringify(list, null, 2));
        setMedications(Array.isArray(list) ? list : []);
      } else {
        console.log("[Vera] getMedicationList is not a function, type:", typeof p.getMedicationList);
      }
    } catch (e) {
      console.error("[Vera] Error fetching medication list:", e);
      setMedications([]);
    }
  }, []);

  useEffect(() => {
    if (!vimOS?.ehr) return;

    const ehr = vimOS.ehr;
    console.log("[Vera] VimOS ehr keys:", Object.keys(ehr));
    console.log("[Vera] VimOS ehr.ehrState:", JSON.stringify(ehr.ehrState, null, 2));
    console.log("[Vera] VimOS ehr.ehrState type:", typeof ehr.ehrState);

    // ---- Initial values from ehrState ----
    try {
      const initialPatient = ehr.ehrState?.patient ?? null;
      console.log("[Vera] Initial patient:", JSON.stringify(initialPatient, null, 2));
      console.log("[Vera] Initial patient type:", typeof initialPatient);
      if (initialPatient) {
        console.log("[Vera] Patient keys:", Object.keys(initialPatient));
        console.log("[Vera] Patient demographics:", JSON.stringify(initialPatient.demographics, null, 2));
        console.log("[Vera] Patient identifiers:", JSON.stringify(initialPatient.identifiers, null, 2));
        console.log("[Vera] Patient has getProblemList:", typeof initialPatient.getProblemList);
        console.log("[Vera] Patient has getMedicationList:", typeof initialPatient.getMedicationList);
      }
      setPatient(initialPatient);
      loadLists(initialPatient);
    } catch (e) {
      console.error("[Vera] Error reading ehrState.patient:", e);
      // ehrState may not exist — stay null
    }

    try {
      const initialEncounter = ehr.ehrState?.encounter ?? null;
      console.log("[Vera] Initial encounter:", JSON.stringify(initialEncounter, null, 2));
      setEncounter(initialEncounter);
    } catch (e) {
      console.error("[Vera] Error reading ehrState.encounter:", e);
      // stay null
    }

    // ---- Subscriptions for live updates ----
    const unsubs: Array<() => void> = [];

    const onPatient = (p: VimEhrPatient | null) => {
      console.log("[Vera] Patient subscription fired:", JSON.stringify(p, null, 2));
      if (p) {
        console.log("[Vera] Subscribed patient keys:", Object.keys(p));
        console.log("[Vera] Subscribed patient demographics:", JSON.stringify(p.demographics, null, 2));
      }
      setPatient(p);
      loadLists(p);
    };

    const onEncounter = (e: VimEhrEncounter | null) => {
      console.log("[Vera] Encounter subscription fired:", JSON.stringify(e, null, 2));
      setEncounter(e);
    };

    console.log("[Vera] ehr.subscribe type:", typeof ehr.subscribe);
    try {
      if (typeof ehr.subscribe === "function") {
        console.log("[Vera] Subscribing to patient and encounter events...");
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
