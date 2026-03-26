import {customTagConfigs} from "@/config/mdast";

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalize custom tags by adding blank lines around them
 * This ensures remark-parse treats them as block-level HTML and parses content inside correctly
 *
 * Example:
 *   Text<guideline>\n## Heading\n</guideline>More
 *     ↓
 *   Text\n\n<guideline>\n\n## Heading\n\n</guideline>\n\nMore
 *
 * Without blank lines, remark treats the entire block as raw HTML.
 * With blank lines, remark parses the markdown content inside normally.
 *
 * @param text - The text containing custom tags
 * @returns Text with normalized blank lines around custom tags
 */
export function normalizeCustomTags(text: string): string {
  let normalized = text;

  customTagConfigs.forEach(({tag, close}) => {
    // Match opening tag with or without attributes: <guideline> or <guideline authority="...">
    const openTagPattern = `<${tag}(?:\\s+[^>]*)?>`;
    const escapedClose = escapeRegex(close);

    // Add \n\n BEFORE opening tag if not already there
    // Match: anything except \n\n followed by <tag>
    normalized = normalized.replace(new RegExp(`(?<!\\n\\n)(${openTagPattern})`, "g"), `\n\n$1`);

    // Add \n\n AFTER opening tag if not already there
    // Match: <tag> followed by anything except \n\n
    normalized = normalized.replace(new RegExp(`(${openTagPattern})(?!\\n\\n)`, "g"), `$1\n\n`);

    // Add \n\n BEFORE closing tag if not already there
    // Match: anything except \n\n followed by </tag>
    normalized = normalized.replace(new RegExp(`(?<!\\n\\n)${escapedClose}`, "g"), `\n\n${close}`);

    // Add \n\n AFTER closing tag if not already there
    // Match: </tag> followed by anything except \n\n
    normalized = normalized.replace(new RegExp(`${escapedClose}(?!\\n\\n)`, "g"), `${close}\n\n`);
  });

  return normalized;
}
