"use client";

import { useEffect, useState } from "react";
import type { VimEhrPatient, VimEhrEncounter } from "@/types/vim";

export function useVimContext() {
  const [patient, setPatient] = useState<VimEhrPatient | null>(null);
  const [encounter, setEncounter] = useState<VimEhrEncounter | null>(null);

  useEffect(() => {
    const sdk = window.vimSdk;
    if (!sdk) return;

    sdk.ehr.patient.get().then(setPatient);
    sdk.ehr.encounter.get().then(setEncounter);

    sdk.ehr.patient.subscribe(setPatient);
    sdk.ehr.encounter.subscribe(setEncounter);
  }, []);

  return { patient, encounter };
}
