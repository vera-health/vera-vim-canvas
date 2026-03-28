import type { VimContextValue } from "./hooks/useVimContext";
import type { EhrContext } from "@/core/types/ehr";

/**
 * Maps VimOS SDK data (from useVimContext) into the integration-agnostic
 * EhrContext shape consumed by core components and formatContext.
 *
 * Because the core EHR types were designed to mirror the Vim property
 * structure, most fields pass through directly.
 */
export function mapVimToEhrContext(vim: VimContextValue): EhrContext {
  return {
    patient: vim.patient
      ? {
          identifiers: vim.patient.identifiers
            ? { patientId: vim.patient.identifiers.ehrPatientId, mrn: vim.patient.identifiers.mrn }
            : undefined,
          demographics: vim.patient.demographics,
        }
      : null,
    encounter: vim.encounter
      ? {
          identifiers: vim.encounter.identifiers
            ? { encounterId: vim.encounter.identifiers.ehrEncounterId }
            : undefined,
          basicInformation: vim.encounter.basicInformation,
          subjective: vim.encounter.subjective,
          objective: vim.encounter.objective,
          assessment: vim.encounter.assessment,
          plan: vim.encounter.plan,
          patientInstructions: vim.encounter.patientInstructions,
          encounterNotes: vim.encounter.encounterNotes,
        }
      : null,
    problems: vim.problems,
    medications: vim.medications,
    allergies: vim.allergies,
    labs: vim.labs,
    vitals: vim.vitals,
  };
}
