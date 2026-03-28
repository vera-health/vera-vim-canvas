/**
 * Integration-agnostic EHR types.
 *
 * These interfaces describe the clinical data shapes that the core chat
 * engine, formatContext, and UI components consume.  Each EHR integration
 * (Vim Canvas, Chrome extension, etc.) maps its native SDK types into
 * these before handing data to core code.
 */

// ─── Patient ───────────────────────────────────────────────────────

export interface EhrPatient {
  identifiers?: { patientId?: string; mrn?: string };
  demographics?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
  };
}

// ─── Encounter ─────────────────────────────────────────────────────

export interface EhrEncounter {
  identifiers?: { encounterId?: string };
  basicInformation?: {
    status?: string;
    encounterDateOfService?: string;
    type?: string;
  };
  subjective?: {
    chiefComplaintNotes?: string;
    historyOfPresentIllnessNotes?: string;
    reviewOfSystemsNotes?: string;
    generalNotes?: string;
  };
  objective?: { generalNotes?: string; physicalExamNotes?: string };
  assessment?: { generalNotes?: string; diagnosisCodes?: EhrDiagnosis[] };
  plan?: { generalNotes?: string };
  patientInstructions?: { generalNotes?: string };
  encounterNotes?: { generalNotes?: string };
}

// ─── Clinical Lists ────────────────────────────────────────────────

export interface EhrDiagnosis {
  code: string;
  system?: string;
  description?: string;
  note?: string;
  status?: string;
}

export interface EhrMedication {
  basicInformation?: { medicationName?: string; status?: string };
}

export interface EhrAllergy {
  allergyDetails?: { name?: string; criticality?: string };
  allergyReactionDetails?: { name?: string; severity?: string };
}

export interface EhrLabResult {
  testName?: string;
  value?: string;
  unit?: string;
  referenceRange?: string;
  collectionDate?: string;
}

export interface EhrVital {
  type?: string;
  value?: string;
  unit?: string;
}

// ─── Context bundle ────────────────────────────────────────────────

export interface EhrContext {
  patient: EhrPatient | null;
  encounter: EhrEncounter | null;
  problems: EhrDiagnosis[];
  medications: EhrMedication[];
  allergies: EhrAllergy[];
  labs: EhrLabResult[];
  vitals: EhrVital[];
}

// ─── Write capability ──────────────────────────────────────────────

export type WriteStatus = "idle" | "writing" | "success" | "error";
export type WriteAvailability = "available" | "unavailable" | "unknown";
export type EhrSectionKey =
  | "subjective"
  | "objective"
  | "assessment"
  | "plan"
  | "patientInstructions"
  | "encounterNotes";

export interface EncounterWritePayload {
  [section: string]: { generalNotes: string } | undefined;
}

export interface EhrWriter {
  getWriteAvailability: (section: EhrSectionKey) => WriteAvailability;
  writeToEncounter: (payload: EncounterWritePayload) => Promise<void>;
  writeStatus: WriteStatus;
  buildSectionPayload: (section: EhrSectionKey, text: string) => EncounterWritePayload;
}
