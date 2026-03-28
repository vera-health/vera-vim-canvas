import type {RemendOptions} from "remend";

/**
 * Figures blob storage domain for identifying figure images
 */
export const FIGURES_DOMAIN = "figuresguidelines.blob.core.windows.net";

/**
 * Remend configuration for closing incomplete markdown during streaming
 * All options default to true, we explicitly configure what we need
 */
export const remendConfig: RemendOptions = {
  links: true,
  images: true,
  linkMode: "protocol", // `[text](url` → `[text](streamdown:incomplete-link)`)
  bold: true,
  italic: true,
  boldItalic: true,
  inlineCode: true,
  strikethrough: true,
  katex: true,
  setextHeadings: true,
};

/**
 * Unified configuration for Vera custom tags
 *
 * Each tag maps to a specific MDAST node type and wrapper component.
 *
 * TODO: Migrate to attribute-based approach: <guideline authority="ACEP"> instead of <acep>
 * This would be cleaner - tag maps to component, attributes map to config variants.
 * For now, keeping <acep> as separate tag to avoid breaking LLM prompts.
 */
export const customTagConfigs = [
  // ACEP has its own tag (temporary - should be <guideline authority="ACEP">)
  {
    tag: "acep",
    open: "<acep>",
    close: "</acep>",
    authority: "American College of Emergency Physicians (ACEP)",
  },
  {
    tag: "guideline",
    open: "<guideline>",
    close: "</guideline>",
  },
  {
    tag: "prior_auth",
    open: "<prior_auth>",
    close: "</prior_auth>",
  },
  {
    tag: "drug",
    open: "<drug>",
    close: "</drug>",
  },
  {
    tag: "patient_material",
    open: "<patient_material>",
    close: "</patient_material>",
  },
] as const;

export type CustomTagConfig = (typeof customTagConfigs)[number];

/**
 * Guideline authority organization styling configuration
 * Maps authority to colors, logo, and display options
 */
export const guidelineSourceConfigs = {
  "American College of Emergency Physicians (ACEP)": {
    colors: {
      bg: "bg-primary-300",
      border: "border-primary-300",
      text: "text-primary-600",
      icon: "text-primary-600",
      chevron: "text-primary-600",
    },
    showLogo: true,
    logoPath: "/logos/acep.png" as string | null,
    logoAlt: "American College of Emergency Physicians" as string | null,
    titleKey: "collapsibleAcepGuideline",
    showReferencesSection: true,
    rightLabelKey: "guidelineLabel" as string | null,
  },
  // Default for all other guidelines
  default: {
    colors: {
      bg: "bg-primary-100",
      border: "border-primary-200",
      text: "text-primary-600",
      icon: "text-primary-500",
      chevron: "text-primary-500",
    },
    showLogo: false,
    logoPath: null as string | null,
    logoAlt: null as string | null,
    titleKey: "collapsibleClinicalGuideline",
    showReferencesSection: false,
    rightLabelKey: null as string | null,
  },
} as const;

/**
 * Figure source (journal) styling configuration
 * Maps journal name to colors, attribution, and display options
 */
export const figureSourceConfigs = {
  "American College of Emergency Physicians (ACEP)": {
    colors: {
      bg: "bg-primary-300",
      border: "border-primary-300",
      text: "text-primary-600",
      icon: "text-primary-600",
      chevron: "text-primary-600",
    },
    showLogo: true,
    logoPath: "/logos/acep.png" as string | null,
    logoAlt: "American College of Emergency Physicians" as string | null,
    attribution: {
      text: "ACEP x Vera Health Clinical Collaboration",
      url: undefined as string | undefined,
    },
    rightLabelKey: "figureLabel" as string | null,
  },
  JAMA: {
    colors: {
      bg: "bg-danger-50",
      border: "border-danger-200",
      text: "text-danger-600",
      icon: "text-danger-500",
      chevron: "text-danger-500",
    },
    showLogo: false,
    logoPath: null as string | null,
    logoAlt: null as string | null,
    attribution: {
      text: "CC-BY 4.0",
      url: "https://jamanetwork.com/pages/cc-by-license-permissions" as string | undefined,
    },
    rightLabelKey: null as string | null,
  },
  // Default for all other figures
  default: {
    colors: {
      bg: "bg-danger-50",
      border: "border-danger-200",
      text: "text-danger-600",
      icon: "text-danger-500",
      chevron: "text-danger-500",
    },
    showLogo: false,
    logoPath: null as string | null,
    logoAlt: null as string | null,
    attribution: null as {text: string; url?: string} | null,
    rightLabelKey: "figureLabel" as string | null,
  },
} as const;

/**
 * Get guideline config by authority (with fallback to default)
 */
export function getGuidelineConfig(authority?: string) {
  if (!authority) return guidelineSourceConfigs.default;

  return (
    guidelineSourceConfigs[authority as keyof typeof guidelineSourceConfigs] ||
    guidelineSourceConfigs.default
  );
}

/**
 * Get figure config by journal name (with partial matching for JAMA)
 */
export function getFigureConfig(journal?: string) {
  if (!journal) return figureSourceConfigs.default;

  // Exact match for ACEP
  if (journal === "American College of Emergency Physicians (ACEP)") {
    return figureSourceConfigs["American College of Emergency Physicians (ACEP)"];
  }

  // Partial match for JAMA journals
  if (journal.includes("JAMA")) {
    return figureSourceConfigs.JAMA;
  }

  return figureSourceConfigs.default;
}
