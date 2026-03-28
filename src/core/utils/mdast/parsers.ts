import type {VeraRoot} from "@/core/types/customAST";
import type {Processor} from "unified";

import {unified} from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import {remendAll} from "./remend";
import {transformToCustomAST} from "./transforms";
import {normalizeCustomTags} from "./normalize";
import {
  latexInlineMath,
  latexInlineMathFromMarkdown,
  latexBlockMath,
  latexBlockMathFromMarkdown,
} from "./plugins";

function registerMdastExtensions(this: Processor) {
  const data = this.data() as {
    micromarkExtensions?: unknown[];
    fromMarkdownExtensions?: unknown[];
  };

  const micromarkExtensions = data.micromarkExtensions || (data.micromarkExtensions = []);
  const fromMarkdownExtensions = data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);

  // Register custom LaTeX delimiters.
  micromarkExtensions.push(latexInlineMath(), latexBlockMath());
  fromMarkdownExtensions.push(latexInlineMathFromMarkdown(), latexBlockMathFromMarkdown());
}

const parser = unified()
  .use(remarkParse)
  .use(registerMdastExtensions)
  .use(remarkGfm)
  .use(remarkMath);

function parseMarkdownToAST(markdown: string): VeraRoot {
  const mdastRoot = parser.parse(markdown);

  return transformToCustomAST(mdastRoot);
}

export function parsePartialMarkdown(markdown: string): VeraRoot {
  // partial markdown always needs to be remended
  const remended = remendAll(markdown);
  const normalized = normalizeCustomTags(remended);

  return parseMarkdownToAST(normalized);
}

export function parseCompleteMarkdown(markdown: string): VeraRoot {
  // Complete markdown doesn't need to be "remended",
  // We only "normalize" custom tags before parsing
  const normalized = normalizeCustomTags(markdown);

  return parseMarkdownToAST(normalized);
}
