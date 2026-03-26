"use client";

import { useEffect, useState } from "react";
import type { VimEhrPatient, VimEhrEncounter } from "@/types/vim";

export function useVimContext() {
  const [patient, setPatient] = useState<VimEhrPatient | null>(null);
  const [encounter, setEncounter] = useState<VimEhrEncounter | null>(null);

  useEffect(() => {
    const sdk = window.vimSdk;
    if (!sdk) return;

    // Tell Vim Hub we're ready
    if (sdk.hub?.setActivationStatus) {
      sdk.hub.setActivationStatus("ENABLED");
    }

    if (!sdk.ehr) return;

    sdk.ehr.patient.get().then(setPatient).catch(() => {});
    sdk.ehr.encounter.get().then(setEncounter).catch(() => {});

    sdk.ehr.patient.subscribe(setPatient);
    sdk.ehr.encounter.subscribe(setEncounter);
  }, []);

  return { patient, encounter };
}
