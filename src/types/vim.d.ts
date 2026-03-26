export interface VimEhrPatient {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  memberId?: string;
}

export interface VimEhrEncounter {
  encounterDate?: string;
  chiefComplaint?: string;
  diagnoses?: Array<{
    code: string;
    description?: string;
    name?: string;
  }>;
}

export interface VimEhr {
  patient: {
    get(): Promise<VimEhrPatient | null>;
    subscribe(cb: (patient: VimEhrPatient | null) => void): void;
  };
  encounter: {
    get(): Promise<VimEhrEncounter | null>;
    subscribe(cb: (encounter: VimEhrEncounter | null) => void): void;
  };
}

export type ActivationStatus = "ENABLED" | "DISABLED" | "LOADING";

export interface VimHub {
  setActivationStatus(status: ActivationStatus): void;
}

export interface VimOS {
  ehr: VimEhr;
  hub: VimHub;
}

export interface VimSdk {
  initializeVimSDK(): Promise<VimOS>;
}

declare global {
  interface Window {
    vimSdk?: VimSdk;
  }
}
