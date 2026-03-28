/**
 * Minimal markdown utilities — only what the MDAST transform pipeline needs.
 * Ported from vera-health/vera's utils/markdownUtils.ts (getRefTypeAndData only).
 */

/**
 * Returns reference type and data based on citation text and href.
 * Used by transforms.ts to classify links into citation/ashp/article/drug/etc.
 */
export const getRefTypeAndData = (href: string, citationText: string, _title?: string) => {
  // Handle ASHP Drug Compendium references
  if (
    (citationText.includes("ASHP Drug Compendium") &&
      (citationText.includes("[") || citationText.includes(";"))) ||
    href === "#drug-info"
  ) {
    return {type: "ashp"};
  }

  // Handle drug references
  if (citationText.startsWith("DRUG:")) {
    const drugInfo = citationText.replace("DRUG:", "");
    return {type: "drug", drugInfo};
  }

  // Handle guideline references
  if (citationText.startsWith("GUIDELINE:")) {
    const match = citationText.match(/GUIDELINE:(.+):(\d+)/);
    if (match) {
      const [, author, page] = match;
      return {type: "guideline", author, page};
    }
  }

  // Handle article reference format [article](url)
  if (citationText.toLowerCase() === "article" && href) {
    return {type: "article", href};
  }

  // Handle DOI link format [1](https://doi.org/...)
  if (citationText.match(/^[0-9]+$/) && href && href.includes("doi.org")) {
    const citationNumber = parseInt(citationText, 10);
    const doiMatch = href.match(/doi\.org\/(.+)$/);
    if (doiMatch) {
      return {type: "citation", citationNumber, doi: doiMatch[1], href};
    }
  }

  // Handle PMID link format [1](https://pubmed.ncbi.nlm.nih.gov/...)
  if (citationText.match(/^[0-9]+$/) && href && href.includes("pubmed.ncbi.nlm.nih.gov")) {
    const citationNumber = parseInt(citationText, 10);
    const pmidMatch = href.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/);
    if (pmidMatch) {
      return {type: "citation", citationNumber, pmid: pmidMatch[1], href};
    }
  }

  // Handle double bracket format [[1]]
  if (citationText.match(/^\[\[[0-9]+\]\]$/)) {
    const numberMatch = citationText.match(/\[\[([0-9]+)\]\]/);
    if (numberMatch) {
      return {type: "citation", citationNumber: parseInt(numberMatch[1], 10)};
    }
  }

  // Handle numeric citations
  if (citationText.match(/^[0-9]+$/)) {
    return {type: "citation", citationNumber: parseInt(citationText, 10)};
  }

  return {type: "default"};
};
