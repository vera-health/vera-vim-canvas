// ---------------------------------------------------------------------------
// Vim OS SDK v2 – TypeScript definitions
// Docs: https://docs.getvim.com/vim-os-js/vim-ehr-connectivity
// ---------------------------------------------------------------------------

// ---- Clinical data models --------------------------------------------------

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

export interface VimLabResult {
  testName?: string;
  value?: string;
  unit?: string;
  referenceRange?: string;
  status?: string;
  collectionDate?: string;
  resultDate?: string;
}

export interface VimVital {
  type?: string;
  value?: string;
  unit?: string;
  recordedDate?: string;
}

// ---- Pagination ------------------------------------------------------------

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
  getLabResults?(input?: VimPaginationInput): Promise<VimPaginationResponse<VimLabResult>>;
  getVitals?(input?: VimPaginationInput): Promise<VimPaginationResponse<VimVital>>;
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

  // Chart retrieval for locked encounters
  putChartRetrievalRequest?(): Promise<{ requestId: string }>;
}

// ---- Write payload types ---------------------------------------------------

/** Max 60K characters, English + numbers + limited special chars. Text fields APPEND. */
type SafeText = string;

export interface UpdatableDiagnosis {
  code: string;
  description: string;
  note?: string;
}

export interface UpdatableProcedure {
  code: string;
  description: string;
}

export interface UpdatableProvider {
  npi?: string;
  demographics: {
    firstName: string;
    lastName: string;
    middleName?: string;
  };
  facility?: {
    name?: string;
    address?: {
      address1?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
    contact_info?: {
      mobilePhoneNumber?: string;
      homePhoneNumber?: string;
      faxNumber?: string;
      email?: string;
    };
  };
  specialty?: string[];
  providerDegree?: string;
}

export interface EncounterUpdatePayload {
  subjective?: {
    generalNotes?: SafeText;
    chiefComplaintNotes?: SafeText;
    historyOfPresentIllnessNotes?: SafeText;
    reviewOfSystemsNotes?: SafeText;
  };
  objective?: {
    generalNotes?: SafeText;
    physicalExamNotes?: SafeText;
  };
  assessment?: {
    generalNotes?: SafeText;
    diagnosisCodes?: UpdatableDiagnosis[];
  };
  plan?: {
    generalNotes?: SafeText;
  };
  billingInformation?: {
    procedureCodes?: UpdatableProcedure[];
  };
  patientInstructions?: {
    generalNotes?: SafeText;
  };
  encounterNotes?: {
    generalNotes?: SafeText;
  };
}

export type ReferralPriority = "ROUTINE" | "URGENT" | "STAT";

export interface ReferralUpdatePayload {
  basicInformation?: {
    notes?: SafeText;
    reasons?: SafeText[];
    authCode?: string;
    specialty?: string;
    startDate?: string; // ISO: YYYY-MM-DD
    endDate?: string;
    priority?: ReferralPriority;
    numberOfVisits?: number;
  };
  procedureCodes?: {
    cpts?: UpdatableProcedure[];
  };
  conditions?: {
    diagnosis?: UpdatableDiagnosis[];
  };
  targetProvider?: UpdatableProvider;
}

export interface OrderUpdatePayload {
  basicInformation?: {
    notes?: SafeText;
  };
  targetProvider?: {
    type: "PROVIDER" | "FACILITY";
    npi?: string;
    demographics?: {
      firstName?: string;
      lastName?: string;
      middleName?: string;
    };
    providerDegree?: string;
    specialty?: string[];
    facility?: {
      name?: string;
      address?: {
        address1?: string;
        city?: string;
        state?: string;
        zipCode?: string;
      };
      contact_info?: {
        mobilePhoneNumber?: string;
        homePhoneNumber?: string;
        faxNumber?: string;
        email?: string;
      };
    };
  };
}

// ---- Writability checks (canUpdate*) ---------------------------------------

export interface CanUpdateEncounterParams {
  subjective?: {
    generalNotes?: boolean;
    chiefComplaintNotes?: boolean;
    historyOfPresentIllnessNotes?: boolean;
    reviewOfSystemsNotes?: boolean;
  };
  objective?: {
    generalNotes?: boolean;
    physicalExamNotes?: boolean;
  };
  assessment?: {
    generalNotes?: boolean;
    diagnosisCodes?: boolean;
  };
  plan?: {
    generalNotes?: boolean;
  };
  billingInformation?: {
    procedureCodes?: boolean;
  };
  patientInstructions?: {
    generalNotes?: boolean;
  };
  encounterNotes?: {
    generalNotes?: boolean;
  };
}

export interface CanUpdateResult<T> {
  canUpdate: boolean;
  details: T;
}

export interface CanUpdateReferralParams {
  basicInformation?: {
    notes?: boolean;
    reasons?: boolean;
    authCode?: boolean;
    specialty?: boolean;
    startDate?: boolean;
    endDate?: boolean;
    priority?: boolean;
    numberOfVisits?: boolean;
  };
  procedureCodes?: {
    cpts?: boolean;
  };
  conditions?: {
    diagnosis?: boolean;
  };
  targetProvider?: boolean;
}

export interface CanUpdateOrderParams {
  basicInformation?: {
    notes?: boolean;
  };
  targetProvider?: boolean;
}

// ---- EHR API ---------------------------------------------------------------

type EhrResource = "patient" | "encounter";
type UpdatableResource = "encounter" | "referral" | "orders";

export interface VimEhr {
  ehrState: {
    patient: VimEhrPatient | null;
    encounter: VimEhrEncounter | null;
  };
  subscribe(
    resource: EhrResource,
    cb: (data: any) => void,
  ): void;
  unsubscribe(
    resource: EhrResource,
    cb: (data: any) => void,
  ): void;
  resourceUpdater?: {
    subscribe(
      resource: UpdatableResource,
      cb: (updatableFields: any) => void,
    ): () => void;
  };
}

// ---- Hub / Activation ------------------------------------------------------

export type ActivationStatus = "ENABLED" | "DISABLED" | "LOADING";

export interface VimHub {
  setActivationStatus(status: ActivationStatus): void;
}

// ---- Workflow events -------------------------------------------------------

export interface VimWorkflowEvents {
  order?: {
    onOrderCreated?(cb: (order: any) => void): () => void;
  };
}

// ---- Top-level SDK objects --------------------------------------------------

export interface VimOS {
  ehr: VimEhr;
  hub: VimHub;
  sessionContext?: Record<string, unknown>;

  // Write methods (rate-limited: 10 req/min/user session)
  updateEncounter?(payload: EncounterUpdatePayload): Promise<void>;
  updateReferral?(payload: ReferralUpdatePayload): Promise<void>;
  updateOrder?(payload: OrderUpdatePayload): Promise<void>;

  // Writability checks
  canUpdateEncounter?(params: CanUpdateEncounterParams): CanUpdateResult<CanUpdateEncounterParams>;
  canUpdateReferral?(params: CanUpdateReferralParams): CanUpdateResult<CanUpdateReferralParams>;
  canUpdateOrder?(params: CanUpdateOrderParams): CanUpdateResult<CanUpdateOrderParams>;

  // Workflow events
  workflowEvents?: VimWorkflowEvents;
}

export interface VimSdk {
  initializeVimSDK(): Promise<VimOS>;
}

declare global {
  interface Window {
    vimSdk?: VimSdk;
  }
}
