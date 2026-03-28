"use client";

import { useCallback, useEffect, useState } from "react";
import { useVimOS } from "@/integrations/vim/VimProvider";
import type {
  VimEhrPatient,
  VimEhrEncounter,
  VimDiagnosis,
  VimMedication,
  VimAllergy,
  VimLabResult,
  VimVital,
  VimOrder,
  VimReferral,
} from "@/integrations/vim/types/vim";

export interface VimContextValue {
  patient: VimEhrPatient | null;
  encounter: VimEhrEncounter | null;
  problems: VimDiagnosis[];
  medications: VimMedication[];
  allergies: VimAllergy[];
  labs: VimLabResult[];
  vitals: VimVital[];
  orders: VimOrder[];
  referral: VimReferral | null;
}

export function useVimContext(): VimContextValue {
  const vimOS = useVimOS();
  const [patient, setPatient] = useState<VimEhrPatient | null>(null);
  const [encounter, setEncounter] = useState<VimEhrEncounter | null>(null);
  const [problems, setProblems] = useState<VimDiagnosis[]>([]);
  const [medications, setMedications] = useState<VimMedication[]>([]);
  const [allergies, setAllergies] = useState<VimAllergy[]>([]);
  const [labs, setLabs] = useState<VimLabResult[]>([]);
  const [vitals, setVitals] = useState<VimVital[]>([]);
  const [orders, setOrders] = useState<VimOrder[]>([]);
  const [referral, setReferral] = useState<VimReferral | null>(null);

  const loadLists = useCallback(async (p: VimEhrPatient | null) => {
    if (!p) {
      setProblems([]);
      setMedications([]);
      setAllergies([]);
      setLabs([]);
      setVitals([]);
      return;
    }
    // Fetch all lists in parallel — one failure shouldn't block the others
    const [problemsResult, medsResult, allergiesResult, labsResult, vitalsResult] =
      await Promise.allSettled([
        typeof p.getProblemList === "function" ? p.getProblemList() : Promise.resolve([]),
        typeof p.getMedicationList === "function" ? p.getMedicationList() : Promise.resolve([]),
        typeof p.getAllergyList === "function" ? p.getAllergyList() : Promise.resolve([]),
        typeof p.getLabResults === "function" ? p.getLabResults({ page: 1 }) : Promise.resolve(null),
        typeof p.getVitals === "function" ? p.getVitals({ page: 1 }) : Promise.resolve(null),
      ]);

    const toArray = <T,>(r: PromiseSettledResult<T[] | T | null | undefined>): T[] => {
      if (r.status === "rejected") return [];
      return Array.isArray(r.value) ? r.value : [];
    };

    setProblems(toArray(problemsResult));
    setMedications(toArray(medsResult));
    setAllergies(toArray(allergiesResult));
    setLabs(
      labsResult.status === "fulfilled" && labsResult.value && typeof labsResult.value === "object" && "data" in labsResult.value
        ? Array.isArray(labsResult.value.data) ? labsResult.value.data : []
        : [],
    );
    setVitals(
      vitalsResult.status === "fulfilled" && vitalsResult.value && typeof vitalsResult.value === "object" && "data" in vitalsResult.value
        ? Array.isArray(vitalsResult.value.data) ? vitalsResult.value.data : []
        : [],
    );
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

    try {
      const initialOrders = ehr.ehrState?.orders;
      setOrders(Array.isArray(initialOrders) ? initialOrders : []);
    } catch {
      // stay empty
    }

    try {
      setReferral(ehr.ehrState?.referral ?? null);
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

    const onOrders = (o: VimOrder[] | null) => {
      setOrders(Array.isArray(o) ? o : []);
    };

    const onReferral = (r: VimReferral | null) => {
      setReferral(r);
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

        ehr.subscribe("orders", onOrders);
        unsubs.push(() => {
          try {
            ehr.unsubscribe("orders", onOrders);
          } catch { /* ignore */ }
        });

        ehr.subscribe("referral", onReferral);
        unsubs.push(() => {
          try {
            ehr.unsubscribe("referral", onReferral);
          } catch { /* ignore */ }
        });
      }
    } catch {
      // subscribe not available — rely on initial values
    }

    return () => {
      unsubs.forEach((fn) => { try { fn(); } catch { /* ignore */ } });
    };
  }, [vimOS, loadLists]);

  return { patient, encounter, problems, medications, allergies, labs, vitals, orders, referral };
}
