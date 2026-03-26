export type EvidenceStrength = "Very High" | "High" | "Moderate" | "Low";

export interface EvidenceLevelData {
  schema_version?: number;
  summary?: string;
  overall_strength: EvidenceStrength | null;
  framework?: string;
  details?: Record<string, unknown>;
  study_characteristics?: {
    design: string | null;
    oxford_level: string;
    sample_size: number | null;
    follow_up_duration: string | null;
    population: string | null;
    multicenter: boolean | null;
    randomized: boolean | null;
  };
  quality_assessment?: {
    risk_of_bias: "Low" | "Moderate" | "High" | "Unknown";
    precision: "High" | "Moderate" | "Low" | "Unknown";
    confounding_adjustment: "Adjusted" | "Unadjusted" | "Not applicable" | "Unknown";
  };
  strength_factors?: string[];
  limitations?: string[];
}

export const EVIDENCE_SCHEMA_VERSION = 1;
