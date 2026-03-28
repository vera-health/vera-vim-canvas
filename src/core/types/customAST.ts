import type {Parent, Node, Literal} from "unist";
import type {
  AlignType,
  Break as MdastBreak,
  Definition as MdastDefinition,
  FootnoteReference as MdastFootnoteReference,
  Image as MdastImage,
  ImageReference as MdastImageReference,
  InlineCode as MdastInlineCode,
  ReferenceType,
  Text as MdastText,
  ThematicBreak as MdastThematicBreak,
  Yaml as MdastYaml,
} from "mdast";

// Mdast types used without modification
export type VeraText = MdastText;
export type VeraImage = MdastImage;
export type VeraInlineCode = MdastInlineCode;
export type VeraBreak = MdastBreak;
export type VeraThematicBreak = MdastThematicBreak;
export type VeraFootnoteReference = MdastFootnoteReference;
export type VeraDefinition = MdastDefinition;
export type VeraYaml = MdastYaml;
export type VeraImageReference = MdastImageReference;

/**
 * Inline math node from remark-math (for KaTeX rendering)
 */
export interface VeraInlineMath extends Literal {
  type: "inlineMath";
  value: string;
}

/**
 * Block math node from remark-math (for KaTeX rendering)
 */
export interface VeraMath extends Literal {
  type: "math";
  value: string;
  meta?: string;
}

/**
 * Level of Evidence badge node
 */
export interface LOENode extends Node {
  type: "loe";
  level: string; // "I", "II", "III"
}

/**
 * Space name chip node
 */
export interface SpaceNameChipNode extends Node {
  type: "spaceNameChip";
  name: string;
}

/**
 * Figure/image node
 */
export interface VeraFigure extends Node {
  type: "figure";
  url: string;
  alt?: string;
}

// =============================================================================
// Vera Node Redefinitions - Expanding children to include custom nodes
// =============================================================================

/**
 * Vera inline/phrasing content - can appear inside paragraphs, headings, etc.
 */
export type VeraPhrasingContent =
  | VeraText
  | VeraEmphasis
  | VeraStrong
  | VeraDelete
  | VeraInlineCode
  | VeraBreak
  | VeraLink
  | VeraCitation // Citation links
  | VeraAshpLink // Drug compendium links
  | VeraArticleLink // News/article links
  | VeraLinkReference
  | VeraImage
  | VeraImageReference
  | VeraFootnoteReference
  | VeraInlineMath // Math from remark-math
  | LOENode // Custom inline node
  | SpaceNameChipNode; // Custom inline node

/**
 * Vera block content - can appear in blockquotes, list items, and inside custom nodes
 *
 * Note: Html is NOT included - we strip all HTML except custom tags
 * Note: Custom block nodes (GuidelineNode, FigureNode, etc.) are NOT included - they only appear at root level
 */
export type VeraBlockContent =
  | VeraParagraph
  | VeraHeading
  | VeraBlockquote
  | VeraList
  | VeraCode
  | VeraMath
  | VeraThematicBreak
  | VeraTable
  | VeraFootnoteDefinition
  | VeraDefinition
  | VeraYaml;

/**
 * Vera root content - can only appear as direct children of VeraRoot
 * Includes all VeraBlockContent + custom block nodes that are top-level only
 */
export type VeraRootContent =
  | VeraBlockContent
  | GuidelineNode // Custom block node (top-level only)
  | DrugInfoNode // Custom block node (top-level only)
  | PriorAuthNode // Custom block node (top-level only)
  | PatientMaterialNode // Custom block node (top-level only)
  | VeraFigure; // Custom block node (top-level only)

/**
 * Vera Paragraph - can contain phrasing content including our custom inline nodes
 */
export interface VeraParagraph extends Parent {
  type: "paragraph";
  children: VeraPhrasingContent[];
}

/**
 * Vera Heading - can contain phrasing content including our custom inline nodes
 */
export interface VeraHeading extends Parent {
  type: "heading";
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  children: VeraPhrasingContent[];
}

/**
 * Vera Blockquote - can contain block content including our custom nodes
 */
export interface VeraBlockquote extends Parent {
  type: "blockquote";
  children: VeraBlockContent[];
}

/**
 * Vera List - can contain list items with our custom nodes
 */
export interface VeraList extends Parent {
  type: "list";
  ordered?: boolean;
  start?: number;
  spread?: boolean;
  children: VeraListItem[];
}

/**
 * Vera ListItem - can contain block content including our custom nodes
 */
export interface VeraListItem extends Parent {
  type: "listItem";
  checked?: boolean | null;
  spread?: boolean;
  children: VeraBlockContent[];
}

/**
 * Vera Emphasis - can contain phrasing content including our custom inline nodes
 */
export interface VeraEmphasis extends Parent {
  type: "emphasis";
  children: VeraPhrasingContent[];
}

/**
 * Vera Strong - can contain phrasing content including our custom inline nodes
 */
export interface VeraStrong extends Parent {
  type: "strong";
  children: VeraPhrasingContent[];
}

/**
 * Vera Delete - can contain phrasing content including our custom inline nodes
 */
export interface VeraDelete extends Parent {
  type: "delete";
  children: VeraPhrasingContent[];
}

/**
 * Vera Link - regular markdown links (fallback)
 */
export interface VeraLink extends Parent {
  type: "link";
  url: string;
  title?: string;
  children: VeraPhrasingContent[];
}

/**
 * Vera Citation - academic paper citation links [1], [2], etc.
 */
export interface VeraCitation extends Parent {
  type: "citation";
  citationNumber: number;
  url: string;
  children: VeraPhrasingContent[];
}

/**
 * Vera ASHP Link - drug compendium links
 */
export interface VeraAshpLink extends Parent {
  type: "ashpLink";
  children: VeraPhrasingContent[];
}

/**
 * Vera Article Link - news/article links
 */
export interface VeraArticleLink extends Parent {
  type: "articleLink";
  url: string;
  children: VeraPhrasingContent[];
}

/**
 * Vera Link Reference - markdown reference-style link
 */
export interface VeraLinkReference extends Parent {
  type: "linkReference";
  identifier: string;
  label?: string;
  referenceType: ReferenceType;
  children: VeraPhrasingContent[];
}

/**
 * Vera Code - block code (no children expansion needed, uses value)
 */
export interface VeraCode extends Literal {
  type: "code";
  lang?: string;
  meta?: string;
  value: string;
}

/**
 * Vera FootnoteDefinition - can contain block content including our custom nodes
 */
export interface VeraFootnoteDefinition extends Parent {
  type: "footnoteDefinition";
  identifier: string;
  label?: string;
  children: VeraBlockContent[];
}

// =============================================================================
// GFM Table Node Definitions
// =============================================================================

/**
 * Vera Table (GFM) - contains table rows
 */
export interface VeraTable extends Parent {
  type: "table";
  /** How cells in columns are aligned */
  align?: AlignType[] | null;
  children: VeraTableRow[];
}

/**
 * Vera TableRow (GFM) - contains table cells
 */
export interface VeraTableRow extends Parent {
  type: "tableRow";
  children: VeraTableCell[];
}

/**
 * Vera TableCell (GFM) - contains phrasing content including custom inline nodes
 */
export interface VeraTableCell extends Parent {
  type: "tableCell";
  children: VeraPhrasingContent[];
}

// =============================================================================
// Custom Vera Block Node Definitions
// =============================================================================

/**
 * Guideline node - wraps clinical guideline content
 * Can contain guidelineContent and guidelineReferences children
 */
export interface GuidelineNode extends Parent {
  type: "guideline";
  /** Authority organization (e.g., "American College of Emergency Physicians (ACEP)") */
  authority?: string;
  children: (GuidelineContentNode | GuidelineReferencesNode)[];
}

/**
 * Guideline content section - actual guideline text
 * Direct child of guideline node
 */
export interface GuidelineContentNode extends Parent {
  type: "guidelineContent";
  children: VeraBlockContent[];
}

/**
 * Guideline references section - cited references at bottom of ACEP guidelines
 * Direct child of guideline node
 */
export interface GuidelineReferencesNode extends Node {
  type: "guidelineReferences";
  citedRefs: Array<{citationNumber: number; url: string}>;
}

/**
 * Prior authorization information node
 */
export interface PriorAuthNode extends Parent {
  type: "priorAuth";
  children: VeraBlockContent[];
}

/**
 * Drug information node
 */
export interface DrugInfoNode extends Parent {
  type: "drugInfo";
  children: VeraBlockContent[];
}

/**
 * Patient material/handout node
 */
export interface PatientMaterialNode extends Parent {
  type: "patientMaterial";
  children: VeraBlockContent[];
}

// =============================================================================
// Type Unions and Root
// =============================================================================

/**
 * Root node for Vera AST
 *
 * Basically an alias of Markdown AST Root, but with expanded children to include custom Vera nodes.
 *
 * Extends unist Parent to maintain compatibility with unist utilities (visit, map, etc.)
 */
export interface VeraRoot extends Parent {
  type: "root";
  children: VeraRootContent[];
}

export type VeraNode =
  | VeraRoot
  | VeraParagraph
  | VeraHeading
  | VeraBlockquote
  | VeraList
  | VeraListItem
  | VeraCode
  | VeraMath
  | VeraText
  | VeraEmphasis
  | VeraStrong
  | VeraDelete
  | VeraInlineCode
  | VeraBreak
  | VeraLink
  | VeraCitation
  | VeraAshpLink
  | VeraArticleLink
  | VeraLinkReference
  | VeraImage
  | VeraImageReference
  | VeraFootnoteReference
  | VeraInlineMath
  | VeraThematicBreak
  | VeraTable
  | VeraTableRow
  | VeraTableCell
  | VeraFootnoteDefinition
  | VeraDefinition
  | VeraYaml
  | LOENode
  | SpaceNameChipNode
  | GuidelineNode
  | GuidelineContentNode
  | GuidelineReferencesNode
  | DrugInfoNode
  | PriorAuthNode
  | PatientMaterialNode
  | VeraFigure;
