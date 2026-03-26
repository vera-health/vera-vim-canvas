import type {
  VimEhrPatient,
  VimEhrEncounter,
  VimDiagnosis,
  VimMedication,
} from "@/types/vim";

export function formatEhrContext(
  patient: VimEhrPatient | null,
  encounter: VimEhrEncounter | null,
  problems?: VimDiagnosis[],
  medications?: VimMedication[],
): string {
  const parts: string[] = [];

  if (patient) {
    const d = patient.demographics;
    const name = [d?.firstName, d?.lastName].filter(Boolean).join(" ");
    const items = [
      name,
      d?.dateOfBirth && `DOB: ${d.dateOfBirth}`,
      patient.identifiers?.mrn && `MRN: ${patient.identifiers.mrn}`,
    ].filter(Boolean);
    if (items.length) parts.push(`[Patient: ${items.join(", ")}]`);
  }

  if (encounter) {
    const info = encounter.basicInformation;
    const items = [
      info?.encounterDateOfService,
      encounter.subjective?.chiefComplaintNotes &&
        `Chief complaint: ${encounter.subjective.chiefComplaintNotes}`,
    ].filter(Boolean);
    if (items.length) parts.push(`[Encounter: ${items.join(" — ")}]`);

    const dx = encounter.assessment?.diagnosisCodes;
    if (dx?.length) {
      const formatted = dx
        .map((d) => `${d.description || d.code} (${d.code})`)
        .join(", ");
      parts.push(`[Encounter Diagnoses: ${formatted}]`);
    }
  }

  if (problems?.length) {
    const formatted = problems
      .map((p) => {
        const label = p.description || p.code;
        return p.status ? `${label} (${p.code}, ${p.status})` : `${label} (${p.code})`;
      })
      .join(", ");
    parts.push(`[Problem List: ${formatted}]`);
  }

  if (medications?.length) {
    const formatted = medications
      .map((m) => m.basicInformation?.medicationName)
      .filter(Boolean)
      .join(", ");
    if (formatted) parts.push(`[Medications: ${formatted}]`);
  }

  return parts.length ? parts.join("\n") + "\n\n" : "";
}
