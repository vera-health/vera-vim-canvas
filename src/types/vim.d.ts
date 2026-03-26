// ---------------------------------------------------------------------------
// Vim OS SDK v2 – TypeScript definitions
// Docs: https://docs.getvim.com/vim-os-js/vim-ehr-connectivity
// ---------------------------------------------------------------------------

export interface VimDiagnosis {
  code: string;
  system: string;
  description?: string;
  note?: string;
  status?: string;
  onsetDate?: string;
}

export interface VimMedication {
  addedDate?: string;
  basicInformation?: {
    medicationName?: string;
    ndcCode?: string;
    status?: string;
  };
  dosage?: {
    strength?: { value?: string };
    form?: { unit?: string };
  };
}

export interface VimAllergy {
  basicInformation?: { onsetDate?: string; status?: string };
  allergyDetails?: { name?: string; criticality?: string };
  allergyReactionDetails?: { name?: string; severity?: string };
}

export interface VimPaginationInput {
  page?: number;
  fromDate?: string;
  untilDate?: string;
}

export interface VimPaginationResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

// ---- Orders ----------------------------------------------------------------

export type VimOrderType = "LAB" | "DI" | "PROCEDURE" | "RX";

export interface VimOrder {
  identifiers?: { ehrOrderId?: string };
  basicInformation?: {
    type?: VimOrderType;
    ehrEncounterId?: string;
    createdDate?: string;
    notes?: string;
    orderName?: string;
    reason?: string;
  };
  assessments?: { assessments?: VimDiagnosis[] };
  medications?: VimMedication[];
}

// ---- Referral --------------------------------------------------------------

export interface VimReferral {
  identifiers?: { ehrReferralId?: string; vimReferralId?: string };
  basicInformation?: {
    specialty?: string;
    startDate?: string;
    endDate?: string;
    createdDate?: string;
    status?: "DRAFT" | "SIGNED" | "DELETED";
    priority?: "ROUTINE" | "URGENT" | "STAT";
    authCode?: string;
    isLocked?: boolean;
    reasons?: string[];
    notes?: string;
    facilityName?: string;
    numberOfVisits?: number;
  };
  conditions?: { diagnosis?: VimDiagnosis[] };
}

// ---- Lab Results -----------------------------------------------------------

export interface VimLabResultEntry {
  name?: string;
  date?: string;
  value?: string;
  unit?: string;
  loincCode?: string;
  referenceRange?: string;
}

export interface VimLabResult {
  basicInformation?: {
    name?: string;
    cptCode?: string;
    cptDescription?: string;
    resultDate?: string;
    resultStatus?: string;
  };
  results?: VimLabResultEntry[];
}

// ---- Patient ---------------------------------------------------------------

export interface VimEhrPatient {
  identifiers?: {
    ehrPatientId?: string;
    vimPatientId?: string;
    mrn?: string;
  };
  demographics?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  address?: Record<string, unknown>;
  insurance?: Record<string, unknown>;
  contact_info?: Record<string, unknown>;
  pcp?: Record<string, unknown>;

  // Clinical list methods (rate-limited: 10 req/min/user/app)
  getProblemList?(): Promise<VimDiagnosis[]>;
  getMedicationList?(): Promise<VimMedication[]>;
  getAllergyList?(): Promise<VimAllergy[]>;
  getLabResults?(params?: VimPaginationInput): Promise<VimPaginationResponse<VimLabResult>>;
}

// ---- Encounter -------------------------------------------------------------

export interface VimEhrEncounter {
  identifiers?: { ehrEncounterId?: string };
  basicInformation?: {
    status?: "LOCKED" | "UNLOCKED";
    encounterDateOfService?: string;
    type?: string;
    selfPay?: boolean;
  };
  provider?: Record<string, unknown>;
  subjective?: {
    chiefComplaintNotes?: string;
    historyOfPresentIllnessNotes?: string;
    reviewOfSystemsNotes?: string;
    generalNotes?: string;
  };
  objective?: {
    generalNotes?: string;
    physicalExamNotes?: string;
  };
  assessment?: {
    generalNotes?: string;
    diagnosisCodes?: VimDiagnosis[];
  };
  plan?: { generalNotes?: string };
  patientInstructions?: { generalNotes?: string };
  encounterNotes?: { generalNotes?: string };
}

// ---- EHR API ---------------------------------------------------------------

type EhrResource = "patient" | "encounter" | "orders" | "referral" | "claim";

export interface VimEhr {
  ehrState: {
    patient: VimEhrPatient | null;
    encounter: VimEhrEncounter | null;
    orders?: VimOrder[] | null;
    referral?: VimReferral | null;
  };
  subscribe(
    resource: EhrResource,
    cb: (data: any) => void,
  ): void;
  unsubscribe(
    resource: EhrResource,
    cb: (data: any) => void,
  ): void;
  workflowEvents?: {
    order?: {
      onOrderCreated?(cb: (order: VimOrder) => void): () => void;
    };
  };
}

// ---- Hub / Activation ------------------------------------------------------

export type ActivationStatus = "ENABLED" | "DISABLED" | "LOADING";

export interface VimHub {
  setActivationStatus(status: ActivationStatus): void;
  notificationBadge?: {
    set(count: number): void;
    hide(): void;
  };
}

// ---- Top-level SDK objects --------------------------------------------------

export interface VimOS {
  ehr: VimEhr;
  hub: VimHub;
  sessionContext?: Record<string, unknown>;
}

export interface VimSdk {
  initializeVimSDK(): Promise<VimOS>;
}

declare global {
  interface Window {
    vimSdk?: VimSdk;
  }
}
