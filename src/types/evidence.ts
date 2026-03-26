export type EvidenceStrength = "Very High" | "High" | "Moderate" | "Low";

export interface EvidenceLevelData {
  overall_strength: EvidenceStrength | null;
  framework?: string;
  details?: Record<string, unknown>;
}

export const EVIDENCE_SCHEMA_VERSION = 1;
