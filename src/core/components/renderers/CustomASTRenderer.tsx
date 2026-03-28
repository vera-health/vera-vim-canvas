"use client";

import type {VeraRoot, VeraNode} from "@/core/types/customAST";
import type {ReferenceSchema, ThreadFigureSchema} from "@/core/types/references";

import React from "react";

// @ts-ignore
import katex from "katex";

import {GuidelineWrapper} from "@/core/components/renderers/wrappers/GuidelineWrapper";
import {GuidelineContentSection} from "@/core/components/renderers/wrappers/GuidelineContentSection";
import {GuidelineReferencesSection} from "@/core/components/renderers/wrappers/GuidelineReferencesSection";
import {DrugInfoWrapper} from "@/core/components/renderers/wrappers/DrugInfoWrapper";
import {PriorAuthWrapper} from "@/core/components/renderers/wrappers/PriorAuthWrapper";
import {PatientMaterialWrapper} from "@/core/components/renderers/wrappers/PatientMaterialWrapper";
import {CodeBlock} from "@/core/components/renderers/wrappers/CodeBlock";
import {FigureWrapper} from "@/core/components/renderers/wrappers/FigureWrapper";
import {LOEBadge} from "@/core/components/renderers/LOEBadge";
import {SpaceNameChip} from "@/core/components/renderers/SpaceNameChip";
import {VeraTableRenderer} from "@/core/components/renderers/VeraTableRenderer";
import {VeraListRenderer} from "@/core/components/renderers/VeraListRenderer";
import {VeraHeadingRenderer} from "@/core/components/renderers/VeraHeadingRenderer";
import {CitationLink} from "@/core/components/renderers/CitationLink";
import {AshpLinkButton} from "@/core/components/renderers/AshpLinkButton";
import {ArticleLink} from "@/core/components/renderers/ArticleLink";
import {sanitizeUrl, findReferenceByUrl, addUtmToUrl} from "@/core/components/renderers/utils";
import StreamingText from "@/core/components/renderers/StreamingText";

interface CustomASTRendererProps {
  ast: VeraRoot;
  figures?: ThreadFigureSchema[];
  references?: ReferenceSchema[];
  evidenceLevels?: Record<string, any>;
  isStreaming?: boolean;
}

interface CustomASTNodeProps {
  node: VeraNode;
  path: string;
  figures: ThreadFigureSchema[];
  references: ReferenceSchema[];
  evidenceLevels?: Record<string, any>;
  isStreaming?: boolean;
}

interface ChildrenProps {
  children: VeraNode[] | undefined;
  path: string;
  figures: ThreadFigureSchema[];
  references: ReferenceSchema[];
  evidenceLevels?: Record<string, any>;
  isStreaming?: boolean;
}

const RenderChildren: React.FC<ChildrenProps> = ({
  children,
  path,
  figures,
  references,
  evidenceLevels,
  isStreaming,
}) => {
  if (!children) return null;

  return (
    <>
      {children.map((child, i) => (
        <CustomASTNode
          key={`${path}.${i}`}
          evidenceLevels={evidenceLevels}
          figures={figures}
          isStreaming={isStreaming}
          node={child}
          path={`${path}.${i}`}
          references={references}
        />
      ))}
    </>
  );
};

/**
 * Memoized single Custom AST node renderer
 * Only re-renders when node reference changes (jsondiffpatch preserves unchanged references)
 */
const CustomASTNode = React.memo<CustomASTNodeProps>(
  ({node, path, figures, references, evidenceLevels, isStreaming}) => {
    const childProps = {path, figures, references, evidenceLevels, isStreaming};

    if (!("type" in node)) {
      console.warn("Unexpected node type", JSON.stringify(node, null, 2));
      return null;
    }

    switch (node.type) {
      case "root":
        return null;

      case "guideline": {
        const guidelineNode = node;
        return (
          <GuidelineWrapper authority={guidelineNode.authority}>
            <RenderChildren {...childProps}>{guidelineNode.children}</RenderChildren>
          </GuidelineWrapper>
        );
      }

      case "guidelineContent": {
        const contentNode = node;
        return (
          <GuidelineContentSection>
            <RenderChildren {...childProps}>{contentNode.children}</RenderChildren>
          </GuidelineContentSection>
        );
      }

      case "guidelineReferences": {
        const refsNode = node;
        return (
          <GuidelineReferencesSection citedRefs={refsNode.citedRefs} references={references} />
        );
      }

      case "priorAuth": {
        const priorAuthNode = node;
        return (
          <PriorAuthWrapper>
            <RenderChildren {...childProps}>{priorAuthNode.children}</RenderChildren>
          </PriorAuthWrapper>
        );
      }

      case "drugInfo": {
        const drugNode = node;
        return (
          <DrugInfoWrapper>
            <RenderChildren {...childProps}>{drugNode.children}</RenderChildren>
          </DrugInfoWrapper>
        );
      }

      case "patientMaterial": {
        const patientNode = node;
        return (
          <PatientMaterialWrapper>
            <RenderChildren {...childProps}>{patientNode.children}</RenderChildren>
          </PatientMaterialWrapper>
        );
      }

      case "loe": {
        const loeNode = node;
        return <LOEBadge level={loeNode.level} />;
      }

      case "spaceNameChip": {
        const chipNode = node;
        return <SpaceNameChip name={chipNode.name} />;
      }

      case "figure": {
        const figureNode = node;
        return <FigureWrapper figuresMetadata={figures} node={figureNode} />;
      }

      case "paragraph": {
        const paragraphNode = node;
        return (
          <p className="mb-4">
            <RenderChildren {...childProps}>{paragraphNode.children}</RenderChildren>
          </p>
        );
      }

      case "heading": {
        const headingNode = node;
        return (
          <VeraHeadingRenderer
            node={headingNode}
            renderChildren={(children) => (
              <RenderChildren {...childProps}>{children}</RenderChildren>
            )}
          />
        );
      }

      case "list": {
        const listNode = node;
        return (
          <VeraListRenderer
            node={listNode}
            renderChildren={(children) => (
              <RenderChildren {...childProps}>{children}</RenderChildren>
            )}
          />
        );
      }

      case "listItem":
        return null;

      case "table": {
        const tableNode = node;
        return (
          <VeraTableRenderer
            node={tableNode}
            renderChildren={(children) => (
              <RenderChildren {...childProps}>{children}</RenderChildren>
            )}
          />
        );
      }

      case "tableRow":
        return null;

      case "tableCell":
        return null;

      case "citation": {
        const citationNode = node;
        const rawHref = addUtmToUrl(citationNode.url);
        const reference = findReferenceByUrl(citationNode.url, references);

        let evidenceStrength: "High" | "Moderate" | "Low" | "Very High" | null = null;
        let evidenceData = null;
        if (evidenceLevels && reference) {
          evidenceData =
            (reference.doi && evidenceLevels[reference.doi]) ||
            (reference.pmid && evidenceLevels[reference.pmid]) ||
            null;
          if (evidenceData?.overall_strength) {
            evidenceStrength = evidenceData.overall_strength;
          }
        }

        return (
          <CitationLink
            citationNumber={citationNode.citationNumber}
            evidenceStrength={evidenceStrength}
            evidenceData={evidenceData}
            href={rawHref}
            reference={reference}
          />
        );
      }

      case "ashpLink":
        return <AshpLinkButton />;

      case "articleLink": {
        const articleNode = node;
        const rawHref = addUtmToUrl(articleNode.url);
        const reference = findReferenceByUrl(articleNode.url, references);
        return <ArticleLink href={rawHref} reference={reference} />;
      }

      case "link": {
        const linkNode = node;
        const safeHref = sanitizeUrl(linkNode.url);
        return (
          <a
            className="text-blue-600 hover:underline"
            href={safeHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            <RenderChildren {...childProps}>{linkNode.children}</RenderChildren>
          </a>
        );
      }

      case "strong": {
        const strongNode = node;
        return (
          <strong>
            <RenderChildren {...childProps}>{strongNode.children}</RenderChildren>
          </strong>
        );
      }

      case "emphasis": {
        const emphasisNode = node;
        return (
          <em>
            <RenderChildren {...childProps}>{emphasisNode.children}</RenderChildren>
          </em>
        );
      }

      case "delete": {
        const deleteNode = node;
        return (
          <del>
            <RenderChildren {...childProps}>{deleteNode.children}</RenderChildren>
          </del>
        );
      }

      case "text": {
        const textNode = node;
        if (isStreaming) {
          return <StreamingText isStreaming={true} value={textNode.value} />;
        }
        return <>{textNode.value}</>;
      }

      case "image": {
        const imageNode = node;
        const safeSrc = sanitizeUrl(imageNode.url);
        if (!safeSrc) return null;
        // eslint-disable-next-line @next/next/no-img-element
        return <img alt={imageNode.alt || ""} className="my-4 max-w-full rounded" src={safeSrc} />;
      }

      case "code": {
        const codeNode = node;
        return <CodeBlock lang={codeNode.lang} value={codeNode.value} />;
      }

      case "inlineCode": {
        const inlineCodeNode = node;
        return (
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800 before:content-none after:content-none">
            {inlineCodeNode.value}
          </code>
        );
      }

      case "blockquote": {
        const blockquoteNode = node;
        return (
          <blockquote className="mb-4 border-l-4 border-gray-300 pl-4 italic">
            <RenderChildren {...childProps}>{blockquoteNode.children}</RenderChildren>
          </blockquote>
        );
      }

      case "footnoteReference": {
        const footnoteRef = node;
        return (
          <sup>
            <a className="text-blue-600 hover:underline" href={`#fn-${footnoteRef.identifier}`}>
              [{footnoteRef.identifier}]
            </a>
          </sup>
        );
      }

      case "footnoteDefinition": {
        const footnoteDef = node;
        return (
          <div
            className="mb-4 border-l-2 border-gray-300 pl-4 text-sm"
            id={`fn-${footnoteDef.identifier}`}
          >
            <sup className="mr-1 font-bold">{footnoteDef.identifier}</sup>
            <RenderChildren {...childProps}>{footnoteDef.children}</RenderChildren>
          </div>
        );
      }

      case "thematicBreak":
        return <hr className="my-4 border-t border-gray-300" />;

      case "break":
        return <br />;

      case "linkReference":
        return null;

      case "imageReference":
        return null;

      case "inlineMath": {
        const html = katex.renderToString(node.value, {
          displayMode: false,
          throwOnError: false,
        });
        return <span dangerouslySetInnerHTML={{__html: html}} />;
      }

      case "math": {
        const html = katex.renderToString(node.value, {
          displayMode: true,
          throwOnError: false,
        });
        return <div dangerouslySetInnerHTML={{__html: html}} className="my-4 overflow-x-auto" />;
      }

      case "definition":
        return null;

      case "yaml":
        return null;

      default: {
        console.warn("Unexpected node type", JSON.stringify(node, null, 2));
        return null;
      }
    }
  },
);

CustomASTNode.displayName = "CustomASTNode";

/**
 * Top-level Custom AST Renderer
 */
export const CustomASTRenderer: React.FC<CustomASTRendererProps> = ({
  ast,
  figures = [],
  references = [],
  evidenceLevels,
  isStreaming,
}) => {
  return (
    <div className="prose prose-sm max-w-none prose-ol:list-decimal prose-ul:list-disc prose-li:marker:text-gray-400 prose-strong:font-semibold text-sm">
      {ast.children.map((node, i) => (
        <CustomASTNode
          key={i}
          evidenceLevels={evidenceLevels}
          figures={figures}
          isStreaming={isStreaming}
          node={node}
          path={`${i}`}
          references={references}
        />
      ))}
    </div>
  );
};
