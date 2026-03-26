"use client";

import { useEffect, useState } from "react";
import { useVimOS } from "@/app/page";
import type { VimEhrPatient, VimEhrEncounter } from "@/types/vim";

export function useVimContext() {
  const vimOS = useVimOS();
  const [patient, setPatient] = useState<VimEhrPatient | null>(null);
  const [encounter, setEncounter] = useState<VimEhrEncounter | null>(null);

  useEffect(() => {
    if (!vimOS?.ehr) return;

    console.log("[Vera] VimOS ehr keys:", Object.keys(vimOS.ehr));

    const unsubs: Array<() => void> = [];

    if (vimOS.ehr.patient) {
      vimOS.ehr.patient.get().then(setPatient).catch(() => {});
      const pUnsub = vimOS.ehr.patient.subscribe(setPatient);
      if (typeof pUnsub === "function") unsubs.push(pUnsub);
    } else {
      console.warn("[Vera] vimOS.ehr.patient is undefined — skipping");
    }

    if (vimOS.ehr.encounter) {
      vimOS.ehr.encounter.get().then(setEncounter).catch(() => {});
      const eUnsub = vimOS.ehr.encounter.subscribe(setEncounter);
      if (typeof eUnsub === "function") unsubs.push(eUnsub);
    } else {
      console.warn("[Vera] vimOS.ehr.encounter is undefined — skipping");
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [vimOS]);

  return { patient, encounter };
}
