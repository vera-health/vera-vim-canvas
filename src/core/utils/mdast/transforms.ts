import type {
  Root as MdastRoot,
  Text as MdastText,
  Paragraph as MdastParagraph,
  RootContent,
  BlockContent,
  DefinitionContent,
  PhrasingContent,
} from "mdast";
import type {
  VeraRoot,
  VeraRootContent,
  VeraBlockContent,
  VeraPhrasingContent,
  VeraParagraph,
  VeraText,
  VeraInlineCode,
  VeraBreak,
  VeraImage,
  VeraImageReference,
  VeraFootnoteReference,
  VeraLinkReference,
  VeraInlineMath,
  VeraMath,
  VeraFigure,
  VeraHeading,
  VeraBlockquote,
  VeraList,
  VeraListItem,
  VeraTable,
  VeraTableRow,
  VeraTableCell,
  VeraCode,
  VeraFootnoteDefinition,
  VeraEmphasis,
  VeraStrong,
  VeraDelete,
  VeraLink,
  VeraCitation,
  VeraAshpLink,
  VeraArticleLink,
  GuidelineNode,
  GuidelineContentNode,
  GuidelineReferencesNode,
  DrugInfoNode,
  PriorAuthNode,
  PatientMaterialNode,
  LOENode,
  SpaceNameChipNode,
  VeraDefinition,
  VeraYaml,
  VeraThematicBreak,
} from "@/core/types/customAST";

import {type CustomTagConfig, FIGURES_DOMAIN} from "@/core/config/mdast";
import {getRefTypeAndData} from "@/core/utils/markdownUtils";

import {parseCustomTag} from "./customTagParser";

// =============================================================================
// Entry Point
// =============================================================================

/**
 * Single-pass builder: MdastRoot → VeraRoot
 *
 * Creates a new Vera tree from an mdast tree in one traversal.
 *
 * Root-level handling:
 * 1. html      → custom tag wrapping (guideline, drugInfo, priorAuth, patientMaterial)
 * 2. paragraph → figure image hoisting
 * 3. image     → standalone figure replacement
 *
 * All levels:
 * 4. text      → LOE and space name pattern splitting (single combined regex)
 * 5. html      → convert to text (orphaned / inline html)
 *
 * @param mdastRoot - The MDAST root node to transform
 */
export function transformToCustomAST(mdastRoot: MdastRoot): VeraRoot {
  const root: VeraRoot = {
    type: "root",
    children: transformRootChildren(mdastRoot.children),
  };

  return root;
}

/**
 * Process root-level children with custom tag wrapping and figure hoisting.
 * Uses a while-loop with index to enable look-ahead for matching close tags.
 *
 * Note: Nested custom tags (e.g., <guideline><guideline>...</guideline></guideline>)
 * will be incorrectly paired - the first closing tag matches the first opening tag.
 * This is acceptable since nested tags should not occur in normal LLM output.
 */
function transformRootChildren(children: RootContent[]): VeraRootContent[] {
  const result: VeraRootContent[] = [];
  let i = 0;

  while (i < children.length) {
    const node = children[i];

    // ── Custom tag wrapping (HTML nodes) ──
    if (node.type === "html") {
      const trimmed = node.value.trim();
      const parsed = parseCustomTag(trimmed);

      if (parsed) {
        const {config, attributes} = parsed;
        const closeIdx = findClosingTag(children, i + 1, config.close);

        if (closeIdx !== -1) {
          // Transform root content between custom tags
          const content: VeraBlockContent[] = [];

          for (const node of children.slice(i + 1, closeIdx)) {
            const transformed = transformRootNode(node);

            if (transformed) content.push(transformed);
          }
          const customNode = buildCustomNode(config, content, attributes);

          result.push(customNode);
          i = closeIdx + 1;
          continue;
        }
      }

      // Orphaned html → paragraph with text
      const textNode: VeraText = {type: "text", value: node.value};
      const paragraph: VeraParagraph = {type: "paragraph", children: [textNode]};

      result.push(paragraph);
      i++;
      continue;
    }

    // ── Custom tag wrapping (paragraph with text nodes - remark didn't recognize as HTML) ──
    if (
      node.type === "paragraph" &&
      node.children.length === 1 &&
      node.children[0].type === "text"
    ) {
      const trimmed = node.children[0].value.trim();
      const parsed = parseCustomTag(trimmed);

      if (parsed) {
        const {config, attributes} = parsed;
        const closeIdx = findClosingTagInParagraphs(children, i + 1, config.close);

        if (closeIdx !== -1) {
          // Transform root content between custom tags
          const content: VeraBlockContent[] = [];

          for (const node of children.slice(i + 1, closeIdx)) {
            const transformed = transformRootNode(node);

            if (transformed) content.push(transformed);
          }
          const customNode = buildCustomNode(config, content, attributes);

          result.push(customNode);
          i = closeIdx + 1;
          continue;
        }
      }
    }

    // ── Paragraph: hoist figure images to root level ──
    if (node.type === "paragraph") {
      result.push(...transformParagraphAtRoot(node));
      i++;
      continue;
    }

    // ── All other content → standard block transform ──
    const transformed = transformRootNode(node);

    if (transformed) result.push(transformed);
    i++;
  }

  return result;
}

/** Scan siblings for a matching closing HTML tag */
function findClosingTag(children: RootContent[], start: number, closeTag: string): number {
  for (let j = start; j < children.length; j++) {
    const child = children[j];

    if (child.type === "html" && child.value.trim() === closeTag) return j;
  }

  return -1;
}

/** Scan siblings for a closing tag that may be in a paragraph text node */
function findClosingTagInParagraphs(
  children: RootContent[],
  start: number,
  closeTag: string,
): number {
  for (let j = start; j < children.length; j++) {
    const child = children[j];

    // Check HTML nodes
    if (child.type === "html" && child.value.trim() === closeTag) return j;
    // Check paragraph text nodes (remark didn't recognize as HTML)
    if (
      child.type === "paragraph" &&
      child.children.length === 1 &&
      child.children[0].type === "text" &&
      child.children[0].value.trim() === closeTag
    ) {
      return j;
    }
  }

  return -1;
}

/**
 * Transform a paragraph at root level — hoists figure images out.
 * Returns one or more VeraRootContent nodes (paragraphs interleaved with figures).
 */
function transformParagraphAtRoot(node: MdastParagraph): VeraRootContent[] {
  const children = transformPhrasingChildren(node.children);

  // Collect figure image indices
  const figureIndices: number[] = [];

  children.forEach((child, idx) => {
    if (child.type === "image" && child.url.includes(FIGURES_DOMAIN)) {
      figureIndices.push(idx);
    }
  });

  if (figureIndices.length === 0) {
    const paragraph: VeraParagraph = {type: "paragraph", children};

    return [paragraph];
  }

  // Split paragraph around figure images
  const result: VeraRootContent[] = [];
  let lastIdx = 0;

  for (const figIdx of figureIndices) {
    const before = children.slice(lastIdx, figIdx);

    if (before.length > 0) {
      const paragraph: VeraParagraph = {type: "paragraph", children: before};

      result.push(paragraph);
    }

    const img = children[figIdx];

    if (img.type === "image") {
      const figure: VeraFigure = {type: "figure", url: img.url, alt: img.alt ?? undefined};

      result.push(figure);
    }

    lastIdx = figIdx + 1;
  }

  const after = children.slice(lastIdx);

  if (after.length > 0) {
    const paragraph: VeraParagraph = {type: "paragraph", children: after};

    result.push(paragraph);
  }

  return result;
}

// TODO: Update all values to use "acep" instead of "American College of Emergency Physicians (ACEP)"
// so that we don't use this function
function mapAuthority(shortName: string): string {
  const mapping: Record<string, string> = {
    acep: "American College of Emergency Physicians (ACEP)",
  };

  return mapping[shortName.toLowerCase()] || shortName;
}

function buildCustomNode(
  config: CustomTagConfig,
  content: VeraBlockContent[],
  attributes: Record<string, string> = {},
): GuidelineNode | DrugInfoNode | PriorAuthNode | PatientMaterialNode {
  switch (config.tag) {
    case "acep":
    case "guideline": {
      // Priority: attribute authority > config authority > undefined
      let authority: string | undefined;

      if (attributes.authority) {
        authority = mapAuthority(attributes.authority);
      } else if ("authority" in config) {
        // TODO: Remove this fallback when we deprecate <acep> tags
        // This is for backward compatibility with config-based authority (e.g., <acep>)
        authority = config.authority;
      }

      const guidelineContent: GuidelineContentNode = {type: "guidelineContent", children: content};
      const children: (GuidelineContentNode | GuidelineReferencesNode)[] = [guidelineContent];

      // ACEP citation extraction
      if (authority === "American College of Emergency Physicians (ACEP)") {
        const citedRefs = extractGuidelineReferences(content);

        if (citedRefs.length > 0) {
          const refs: GuidelineReferencesNode = {type: "guidelineReferences", citedRefs};

          children.push(refs);
        }
      }

      const guideline: GuidelineNode = {type: "guideline", authority, children};

      return guideline;
    }

    case "drug": {
      const node: DrugInfoNode = {type: "drugInfo", children: content};

      return node;
    }

    case "prior_auth": {
      const node: PriorAuthNode = {type: "priorAuth", children: content};

      return node;
    }

    case "patient_material": {
      const node: PatientMaterialNode = {type: "patientMaterial", children: content};

      return node;
    }

    default: {
      const _exhaustive: never = config as never;

      throw new Error(`Unhandled config tag: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

/** Walk transformed Vera block content to extract citation numbers and URLs from DOI/PubMed links */
function extractGuidelineReferences(
  nodes: VeraBlockContent[],
): Array<{citationNumber: number; url: string}> {
  const citedRefs = new Map<number, string>();

  function walkBlock(node: VeraBlockContent): void {
    switch (node.type) {
      case "paragraph":
      case "heading":
        node.children.forEach(walkPhrasing);
        break;
      case "blockquote":
      case "footnoteDefinition":
        node.children.forEach(walkBlock);
        break;
      case "list":
        for (const item of node.children) item.children.forEach(walkBlock);
        break;
      case "table":
        for (const row of node.children)
          for (const cell of row.children) cell.children.forEach(walkPhrasing);
        break;
      case "code":
      case "thematicBreak":
      case "definition":
      case "yaml":
        break;
    }
  }

  function walkPhrasing(node: VeraPhrasingContent): void {
    switch (node.type) {
      case "citation": {
        // Capture citation number and URL from VeraCitation nodes
        citedRefs.set(node.citationNumber, node.url);
        node.children.forEach(walkPhrasing);
        break;
      }
      case "link": {
        // Fallback: handle regular links with DOI/PMID URLs (in case they weren't transformed to citations)
        const isDoi = node.url.includes("doi.org");
        const isPubmed = node.url.includes("pubmed.ncbi.nlm.nih.gov");

        if ((isDoi || isPubmed) && node.children.length > 0) {
          const first = node.children[0];

          if (first.type === "text") {
            const num = parseInt(first.value, 10);

            if (!isNaN(num)) citedRefs.set(num, node.url);
          }
        }
        node.children.forEach(walkPhrasing);
        break;
      }
      case "emphasis":
      case "strong":
      case "delete":
        node.children.forEach(walkPhrasing);
        break;
      default:
        break; // Leaf phrasing nodes — nothing to walk
    }
  }

  nodes.forEach(walkBlock);

  // Convert Map to array and sort by citation number
  return Array.from(citedRefs.entries())
    .map(([citationNumber, url]) => ({citationNumber, url}))
    .sort((a, b) => a.citationNumber - b.citationNumber);
}

/**
 * Transform an array of mdast block/definition content into Vera block content.
 * Used for children of blockquotes, list items, and footnote definitions.
 */
function transformBlockChildren(
  children: Array<BlockContent | DefinitionContent>,
): VeraBlockContent[] {
  const result: VeraBlockContent[] = [];

  for (const node of children) {
    // DefinitionContent (definition, footnoteDefinition) needs special handling
    if (node.type === "definition") {
      const definition: VeraDefinition = {
        type: "definition",
        identifier: node.identifier,
        label: node.label ?? undefined,
        url: node.url,
        title: node.title ?? undefined,
      };

      result.push(definition);
    } else if (node.type === "footnoteDefinition") {
      const footnoteDef: VeraFootnoteDefinition = {
        type: "footnoteDefinition",
        identifier: node.identifier,
        label: node.label ?? undefined,
        children: transformBlockChildren(node.children),
      };

      result.push(footnoteDef);
    } else {
      // BlockContent - delegate to block handler
      const transformed = transformBlockContentNode(node);

      result.push(transformed);
    }
  }

  return result;
}

/**
 * Transform proper mdast block content into Vera block nodes.
 * Only handles standard BlockContent types - no edge cases.
 */
function transformBlockContentNode(node: BlockContent): VeraBlockContent {
  switch (node.type) {
    case "paragraph": {
      const paragraph: VeraParagraph = {
        type: "paragraph",
        children: transformPhrasingChildren(node.children),
      };

      return paragraph;
    }

    case "heading": {
      const heading: VeraHeading = {
        type: "heading",
        depth: node.depth,
        children: transformPhrasingChildren(node.children),
      };

      return heading;
    }

    case "blockquote": {
      const blockquote: VeraBlockquote = {
        type: "blockquote",
        children: transformBlockChildren(node.children),
      };

      return blockquote;
    }

    case "list": {
      const listItems: VeraListItem[] = node.children.map((item) => {
        const listItem: VeraListItem = {
          type: "listItem",
          checked: item.checked ?? undefined,
          spread: item.spread ?? undefined,
          children: transformBlockChildren(item.children),
        };

        return listItem;
      });
      const list: VeraList = {
        type: "list",
        ordered: node.ordered ?? undefined,
        start: node.start ?? undefined,
        spread: node.spread ?? undefined,
        children: listItems,
      };

      return list;
    }

    case "table": {
      const tableRows: VeraTableRow[] = node.children.map((row) => {
        const cells: VeraTableCell[] = row.children.map((cell) => {
          const tableCell: VeraTableCell = {
            type: "tableCell",
            children: transformPhrasingChildren(cell.children),
          };

          return tableCell;
        });
        const tableRow: VeraTableRow = {type: "tableRow", children: cells};

        return tableRow;
      });
      const table: VeraTable = {type: "table", align: node.align, children: tableRows};

      return table;
    }

    case "code": {
      const code: VeraCode = {
        type: "code",
        lang: node.lang ?? undefined,
        meta: node.meta ?? undefined,
        value: node.value,
      };

      return code;
    }

    case "thematicBreak": {
      const thematicBreak: VeraThematicBreak = {type: "thematicBreak"};

      return thematicBreak;
    }

    case "html": {
      // HTML at block level → text in paragraph
      const textNode: VeraText = {type: "text", value: node.value};
      const paragraph: VeraParagraph = {type: "paragraph", children: [textNode]};

      return paragraph;
    }

    case "math": {
      // Block math (from remark-math plugin)
      const math: VeraMath = {
        type: "math",
        value: node.value,
        meta: node.meta ?? undefined,
      };

      return math;
    }

    default: {
      // Exhaustive check — TypeScript errors here if a BlockContent type is unhandled
      const _exhaustive: never = node;

      return _exhaustive;
    }
  }
}

/**
 * Transform any RootContent node into a Vera block node.
 * Handles all RootContent types including edge cases (orphaned phrasing, metadata, etc).
 */
function transformRootNode(node: RootContent): VeraBlockContent | null {
  switch (node.type) {
    // ── Standard block content → delegate to block handler ──
    case "paragraph":
    case "heading":
    case "blockquote":
    case "list":
    case "table":
    case "code":
    case "thematicBreak":
    case "html":
    case "math": // Block math (from remark-math plugin)
      return transformBlockContentNode(node);

    // ── Metadata nodes ──
    case "footnoteDefinition": {
      const footnoteDef: VeraFootnoteDefinition = {
        type: "footnoteDefinition",
        identifier: node.identifier,
        label: node.label ?? undefined,
        children: transformBlockChildren(node.children),
      };

      return footnoteDef;
    }

    case "definition": {
      const definition: VeraDefinition = {
        type: "definition",
        identifier: node.identifier,
        label: node.label ?? undefined,
        url: node.url,
        title: node.title ?? undefined,
      };

      return definition;
    }

    case "yaml": {
      const yaml: VeraYaml = {type: "yaml", value: node.value};

      return yaml;
    }

    // ── Orphaned phrasing content (malformed mdast) → wrap in paragraph ──
    case "text":
    case "emphasis":
    case "strong":
    case "delete":
    case "link":
    case "inlineCode":
    case "break":
    case "image":
    case "imageReference":
    case "footnoteReference":
    case "linkReference":
    case "inlineMath": {
      const paragraph: VeraParagraph = {
        type: "paragraph",
        children: transformPhrasingChildren([node]),
      };

      return paragraph;
    }

    // ── Standalone listItem (malformed mdast) → wrap in list ──
    case "listItem": {
      const listItem: VeraListItem = {
        type: "listItem",
        checked: node.checked ?? undefined,
        spread: node.spread ?? undefined,
        children: transformBlockChildren(node.children),
      };
      const list: VeraList = {type: "list", ordered: false, children: [listItem]};

      return list;
    }

    // ── Table internals (malformed mdast) → skip ──
    case "tableRow":
    case "tableCell":
      return null;

    default: {
      // Exhaustive check — TypeScript errors here if a RootContent type is unhandled
      const _exhaustive: never = node;

      return _exhaustive;
    }
  }
}

/** Transform an array of mdast phrasing content into Vera phrasing content */
function transformPhrasingChildren(children: PhrasingContent[]): VeraPhrasingContent[] {
  const result: VeraPhrasingContent[] = [];

  for (const node of children) {
    switch (node.type) {
      case "text":
        result.push(...splitTextPatterns(node));
        break;

      case "emphasis": {
        const emphasis: VeraEmphasis = {
          type: "emphasis",
          children: transformPhrasingChildren(node.children),
        };

        result.push(emphasis);
        break;
      }

      case "strong": {
        const strong: VeraStrong = {
          type: "strong",
          children: transformPhrasingChildren(node.children),
        };

        result.push(strong);
        break;
      }

      case "delete": {
        const del: VeraDelete = {
          type: "delete",
          children: transformPhrasingChildren(node.children),
        };

        result.push(del);
        break;
      }

      case "link": {
        const firstChild = node.children[0];
        const citationText = firstChild && firstChild.type === "text" ? firstChild.value : "";
        const refData = getRefTypeAndData(node.url, citationText, node.title ?? undefined);

        // Create appropriate node type based on classification
        switch (refData.type) {
          case "ashp":
          case "drug": {
            const ashpLink: VeraAshpLink = {
              type: "ashpLink",
              children: transformPhrasingChildren(node.children),
            };

            result.push(ashpLink);
            break;
          }

          case "article": {
            const articleLink: VeraArticleLink = {
              type: "articleLink",
              url: node.url,
              children: transformPhrasingChildren(node.children),
            };

            result.push(articleLink);
            break;
          }

          case "citation": {
            // Only create citation if we have a valid citation number
            if (refData.citationNumber !== undefined) {
              const citation: VeraCitation = {
                type: "citation",
                citationNumber: refData.citationNumber,
                url: node.url,
                children: transformPhrasingChildren(node.children),
              };

              result.push(citation);
            } else {
              // Fallback to regular link if no valid citation number
              const link: VeraLink = {
                type: "link",
                url: node.url,
                title: node.title ?? undefined,
                children: transformPhrasingChildren(node.children),
              };

              result.push(link);
            }
            break;
          }

          default: {
            // Regular link (fallback)
            const link: VeraLink = {
              type: "link",
              url: node.url,
              title: node.title ?? undefined,
              children: transformPhrasingChildren(node.children),
            };

            result.push(link);
            break;
          }
        }
        break;
      }

      case "html": {
        // Inline html → text
        const textNode: VeraText = {type: "text", value: node.value};

        result.push(textNode);
        break;
      }

      case "inlineCode": {
        const inlineCode: VeraInlineCode = {
          type: "inlineCode",
          value: node.value,
        };

        result.push(inlineCode);
        break;
      }

      case "break": {
        const lineBreak: VeraBreak = {type: "break"};

        result.push(lineBreak);
        break;
      }

      case "image": {
        const image: VeraImage = {
          type: "image",
          url: node.url,
          title: node.title ?? undefined,
          alt: node.alt ?? undefined,
        };

        result.push(image);
        break;
      }

      case "imageReference": {
        const imageRef: VeraImageReference = {
          type: "imageReference",
          identifier: node.identifier,
          label: node.label ?? undefined,
          referenceType: node.referenceType,
          alt: node.alt ?? undefined,
        };

        result.push(imageRef);
        break;
      }

      case "footnoteReference": {
        const footnoteRef: VeraFootnoteReference = {
          type: "footnoteReference",
          identifier: node.identifier,
          label: node.label ?? undefined,
        };

        result.push(footnoteRef);
        break;
      }

      case "linkReference": {
        const linkRef: VeraLinkReference = {
          type: "linkReference",
          identifier: node.identifier,
          label: node.label ?? undefined,
          referenceType: node.referenceType,
          children: transformPhrasingChildren(node.children),
        };

        result.push(linkRef);
        break;
      }

      case "inlineMath": {
        const inlineMath: VeraInlineMath = {
          type: "inlineMath",
          value: node.value,
        };

        result.push(inlineMath);
        break;
      }

      default: {
        const _exhaustive: never = node;

        result.push(_exhaustive);
      }
    }
  }

  return result;
}

/**
 * Split text patterns (LOE badges + space name chips + ASHP links) in a single combined regex pass.
 * Returns the original node wrapped in an array if no patterns found.
 */
function splitTextPatterns(node: MdastText): VeraPhrasingContent[] {
  const text = node.value;
  // Combined pattern for LOE, space names, and ASHP Drug Compendium references
  const pattern =
    /\[(?:Class|Level)\s+(I{1,3})\s+evidence\]|\[Space Source: ([^\]]+)\]|ASHP Drug Compendium\s*\[([^\]]+)\]/gi;

  const result: VeraPhrasingContent[] = [];
  let lastIdx = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Text before the match
    if (match.index > lastIdx) {
      const textNode: VeraText = {type: "text", value: text.slice(lastIdx, match.index)};

      result.push(textNode);
    }

    if (match[1] !== undefined) {
      // LOE: [Class/Level I/II/III evidence]
      const loeNode: LOENode = {type: "loe", level: match[1].toUpperCase()};

      result.push(loeNode);
    } else if (match[2] !== undefined) {
      // Space source: [Space Source: X]
      const chipNode: SpaceNameChipNode = {type: "spaceNameChip", name: match[2].trim()};

      result.push(chipNode);
    } else if (match[3] !== undefined) {
      // ASHP Drug Compendium: ASHP Drug Compendium [Drug Name]
      const ashpLink: VeraAshpLink = {
        type: "ashpLink",
        children: [{type: "text", value: `ASHP Drug Compendium [${match[3]}]`}],
      };

      result.push(ashpLink);
    }

    lastIdx = match.index + match[0].length;
  }

  // No patterns found → return original node
  if (result.length === 0) return [node];

  // Remaining text after last match
  if (lastIdx < text.length) {
    const textNode: VeraText = {type: "text", value: text.slice(lastIdx)};

    result.push(textNode);
  }

  return result;
}
