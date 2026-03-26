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

    vimOS.ehr.patient.get().then(setPatient).catch(() => {});
    vimOS.ehr.encounter.get().then(setEncounter).catch(() => {});

    const unsubs: Array<() => void> = [];
    const pUnsub = vimOS.ehr.patient.subscribe(setPatient);
    const eUnsub = vimOS.ehr.encounter.subscribe(setEncounter);
    if (typeof pUnsub === "function") unsubs.push(pUnsub);
    if (typeof eUnsub === "function") unsubs.push(eUnsub);

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [vimOS]);

  return { patient, encounter };
}
