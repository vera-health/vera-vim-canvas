import type {ReferenceSchema} from "@/core/types/references";

/**
 * Sanitizes a URL to prevent XSS attacks by only allowing safe protocols.
 */
export function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const sanitizedUrl = url.trim();
  const isSafe = /^(https?:\/\/|mailto:|tel:|\/(?!\/))/i.test(sanitizedUrl);
  return isSafe ? sanitizedUrl : undefined;
}

/**
 * Finds a reference by matching DOI or PMID from a citation URL
 */
export function findReferenceByUrl(
  url: string,
  references: ReferenceSchema[],
): ReferenceSchema | undefined {
  const cleanedIdentifier = url
    .replace("https://doi.org/", "")
    .replace("https://pubmed.ncbi.nlm.nih.gov/", "")
    .replace(/\/$/, "")
    .toLowerCase();

  return references.find((ref) => {
    const refDoi = ref.doi?.toLowerCase() !== "na" ? ref.doi?.toLowerCase() : null;
    const refPmid = ref.pmid?.toLowerCase();
    return (refDoi && refDoi === cleanedIdentifier) || (refPmid && refPmid === cleanedIdentifier);
  });
}

/**
 * Appends UTM params to a URL (no-op for now in vim canvas).
 */
export function addUtmToUrl(url: string | undefined): string | undefined {
  return url;
}
