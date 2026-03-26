import type {
  VimEhrPatient,
  VimEhrEncounter,
  VimDiagnosis,
  VimMedication,
  VimAllergy,
  VimLabResult,
  VimVital,
} from "@/types/vim";

export function formatEhrContext(
  patient: VimEhrPatient | null,
  encounter: VimEhrEncounter | null,
  problems?: VimDiagnosis[],
  medications?: VimMedication[],
  allergies?: VimAllergy[],
  labs?: VimLabResult[],
  vitals?: VimVital[],
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

  if (allergies?.length) {
    const formatted = allergies
      .map((a) => {
        const name = a.allergyDetails?.name;
        if (!name) return null;
        const items = [name];
        if (a.allergyDetails?.criticality) items.push(`${a.allergyDetails.criticality} criticality`);
        if (a.allergyReactionDetails?.name) items.push(a.allergyReactionDetails.name);
        if (a.allergyReactionDetails?.severity) items.push(a.allergyReactionDetails.severity);
        return items.join(", ");
      })
      .filter(Boolean)
      .join("; ");
    if (formatted) parts.push(`[Allergies: ${formatted}]`);
  }

  if (labs?.length) {
    const formatted = labs
      .map((l) => {
        const items = [l.testName];
        if (l.value) items.push(l.unit ? `${l.value} ${l.unit}` : l.value);
        if (l.collectionDate) items.push(`(${l.collectionDate})`);
        return items.filter(Boolean).join(" ");
      })
      .filter((s) => s.length > 0)
      .join(", ");
    if (formatted) parts.push(`[Recent Labs: ${formatted}]`);
  }

  if (vitals?.length) {
    const formatted = vitals
      .map((v) => {
        if (!v.type || !v.value) return null;
        return v.unit ? `${v.type} ${v.value} ${v.unit}` : `${v.type} ${v.value}`;
      })
      .filter(Boolean)
      .join(", ");
    if (formatted) parts.push(`[Vitals: ${formatted}]`);
  }

  return parts.length ? parts.join("\n") + "\n\n" : "";
}
