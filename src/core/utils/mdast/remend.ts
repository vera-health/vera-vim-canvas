import remend from "remend";

import {remendConfig, customTagConfigs} from "@/core/config/mdast";

import {needsClosingTag} from "./customTagParser";

/**
 * Remend markdown text by closing unclosed constructs
 * Uses global remend options from config
 *
 * @param text - The markdown text to remend
 * @returns The remended markdown text
 */
export function remendMarkdown(text: string): string {
  return remend(text, remendConfig);
}

/**
 * Remend custom tags by closing unclosed tags
 * Handles Vera-specific tags like <guideline>, <prior_auth>, etc.
 *
 * Closes ONE unclosed tag per tag type if opening tags exceed closing tags.
 * Designed for streaming LLM output where at most one tag per type is unclosed.
 *
 * For tags with attributes (e.g., <guideline authority="acep">), we wait until
 * the complete opening tag appears before remending.
 *
 * Note: If multiple tags of the same type are unclosed, only one will be closed.
 * This is acceptable for streaming use cases but may not handle malformed input.
 *
 * TODO: Optimistically patch incomplete opening tags when confidence is high
 * e.g., <guidelin → <guideline></guideline>
 *
 * @param text - The text containing custom tags
 * @returns Text with closed custom tags
 */
export function remendCustomTags(text: string): string {
  let remended = text;

  customTagConfigs.forEach(({tag, close}) => {
    if (needsClosingTag(remended, tag, close)) {
      remended += "\n\n" + close;
    }
  });

  return remended;
}

export function remendAll(text: string): string {
  // First remend standard markdown
  let result = remendMarkdown(text);

  // Then remend custom tags
  result = remendCustomTags(result);

  return result;
}
