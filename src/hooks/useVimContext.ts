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

    vimOS.ehr.patient.subscribe(setPatient);
    vimOS.ehr.encounter.subscribe(setEncounter);
  }, [vimOS]);

  return { patient, encounter };
}
