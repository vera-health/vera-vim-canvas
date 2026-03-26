import type { VimEhrPatient, VimEhrEncounter } from "@/types/vim";

export function formatEhrContext(
  patient: VimEhrPatient | null,
  encounter: VimEhrEncounter | null,
): string {
  const parts: string[] = [];

  if (patient) {
    const name = [patient.firstName, patient.lastName]
      .filter(Boolean)
      .join(" ");
    const items = [
      name,
      patient.dateOfBirth && `DOB: ${patient.dateOfBirth}`,
    ].filter(Boolean);
    if (items.length) parts.push(`[Patient: ${items.join(", ")}]`);
  }

  if (encounter) {
    const items = [
      encounter.encounterDate,
      encounter.chiefComplaint &&
        `Chief complaint: ${encounter.chiefComplaint}`,
    ].filter(Boolean);
    if (items.length) parts.push(`[Encounter: ${items.join(" — ")}]`);

    if (encounter.diagnoses?.length) {
      const dx = encounter.diagnoses
        .map((d) => `${d.description || d.name} (${d.code})`)
        .join(", ");
      parts.push(`[Diagnoses: ${dx}]`);
    }
  }

  return parts.length ? parts.join("\n") + "\n\n" : "";
}
