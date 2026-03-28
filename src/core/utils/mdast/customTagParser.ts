import {customTagConfigs, type CustomTagConfig} from "@/core/config/mdast";

/**
 * Matches a custom HTML tag with optional attributes
 * Captures: (1) tag name, (2) attributes string
 *
 * Examples:
 * - <guideline> → ["<guideline>", "guideline", undefined]
 * - <guideline authority="acep"> → ["<guideline authority=\"acep\">", "guideline", " authority=\"acep\""]
 * - <prior_auth> → ["<prior_auth>", "prior_auth", undefined]
 */
const TAG_WITH_OPTIONAL_ATTRS_REGEX = /^<(\w+(?:-\w+)*)(\s+[^>]+)?>$/;

/**
 * Matches attribute name-value pairs (supports both single and double quotes)
 * Captures: (1) attribute name, (2) attribute value
 *
 * Examples:
 * - authority="acep" → ["authority=\"acep\"", "authority", "acep"]
 * - authority='acep' → ["authority='acep'", "authority", "acep"]
 */
const ATTRIBUTE_REGEX = /(\w+)=["']([^"']*)["']/g;

/**
 * Creates a regex to match opening tags with optional attributes for a specific tag name
 * Matches both <tag> and <tag attr="value">
 *
 * @param tagName - The tag name (e.g., "guideline")
 * @returns Regex pattern for matching opening tags
 */
function createOpeningTagRegex(tagName: string): RegExp {
  return new RegExp(`<${tagName}(\\s+[^>]+)?>`, "g");
}

export interface ParsedCustomTag {
  config: CustomTagConfig;
  attributes: Record<string, string>;
}

function countOccurrences(text: string, pattern: string): number {
  let count = 0;
  let pos = 0;

  while ((pos = text.indexOf(pattern, pos)) !== -1) {
    count++;
    pos += pattern.length;
  }

  return count;
}

function parseAttributes(attrsString: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  let match;

  // Reset regex state
  ATTRIBUTE_REGEX.lastIndex = 0;

  while ((match = ATTRIBUTE_REGEX.exec(attrsString)) !== null) {
    attributes[match[1]] = match[2];
  }

  return attributes;
}

export function parseCustomTag(htmlValue: string): ParsedCustomTag | undefined {
  const tagMatch = htmlValue.match(TAG_WITH_OPTIONAL_ATTRS_REGEX);

  if (tagMatch) {
    const [, tagName, attrsString] = tagMatch;
    const config = customTagConfigs.find((c) => c.tag === tagName);

    if (!config) return undefined;

    const attributes = attrsString ? parseAttributes(attrsString) : {};

    return {config, attributes};
  }

  // Fallback: exact match for simple tags (e.g., <acep>)
  const config = customTagConfigs.find((c) => c.open === htmlValue);

  return config ? {config, attributes: {}} : undefined;
}

export function needsClosingTag(text: string, tag: string, close: string): boolean {
  const openCount = (text.match(createOpeningTagRegex(tag)) || []).length;
  const closeCount = countOccurrences(text, close);

  return openCount > closeCount;
}
