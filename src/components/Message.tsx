"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CornerDownRight } from "lucide-react";
import type { Message as MessageType } from "@/hooks/useVeraChat";
import { CustomASTRenderer } from "@/components/renderers";
import ThinkingSteps from "./ThinkingSteps";
import { ActionBar } from "./ActionBar";
import { SourcesDrugsPanel } from "./SourcesDrugsPanel";
import type { VeraBlockContent, VeraRoot } from "@/types/customAST";
import type { ReferenceSchema } from "@/types/references";
import { findReferenceByUrl } from "@/components/renderers/utils";

export function Message({
  message,
  isStreaming,
  onQuestionClick,
  onRegenerate,
}: {
  message: MessageType;
  isStreaming?: boolean;
  onQuestionClick?: (question: string) => void;
  onRegenerate?: () => void;
}) {
  const isUser = message.role === "user";
  const hasContent = message.content.length > 0;

  const [panel, setPanel] = useState<{ open: boolean; tab: "sources" | "drugs" }>({
    open: false,
    tab: "sources",
  });

  // Extract drug nodes from AST for the panel
  const drugNodes = useMemo(() => {
    if (!message.mdast) return [];
    return message.mdast.children
      .filter((n) => n.type === "drugInfo")
      .map((n) => ({
        type: "root" as const,
        children: ("children" in n ? n.children : []) as VeraBlockContent[],
      }));
  }, [message.mdast]);

  // Filter references to only those actually cited in the answer
  const citedReferences = useMemo(() => {
    if (!message.mdast || !message.references?.length) return [];
    // Walk AST to collect all citation URLs
    const citationUrls = new Set<string>();
    const walk = (node: any) => {
      if (node.type === "citation" && node.url) {
        citationUrls.add(node.url);
      }
      if (node.children) {
        for (const child of node.children) walk(child);
      }
    };
    walk(message.mdast);
    // Match each citation URL to a reference
    const seen = new Set<string>();
    const refs: ReferenceSchema[] = [];
    for (const url of citationUrls) {
      const ref = findReferenceByUrl(url, message.references);
      if (ref) {
        const key = ref.doi || ref.pmid || ref.url || ref.id || url;
        if (!seen.has(key)) {
          seen.add(key);
          refs.push(ref);
        }
      }
    }
    return refs;
  }, [message.mdast, message.references]);

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] rounded-2xl px-3 py-3 text-sm leading-relaxed"
          style={{
            backgroundColor: "#EDF1F5",
            color: "#37475E",
            fontFamily: "Manrope, system-ui, sans-serif",
          }}
        >
          <span className="whitespace-pre-wrap">{message.content}</span>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start">
      <div
        className="w-full text-sm leading-relaxed vera-prose"
        style={{
          color: "#37475E",
          fontFamily: "Manrope, system-ui, sans-serif",
        }}
      >
        {/* Grok-style ephemeral steps + Vercel-style reasoning */}
        <AnimatePresence>
          {message.thinking && (
            <ThinkingSteps thinking={message.thinking} hasContent={hasContent} />
          )}
        </AnimatePresence>

        {/* AST-rendered content */}
        {message.mdast ? (
          <CustomASTRenderer
            ast={message.mdast}
            references={message.references}
            evidenceLevels={message.evidenceLevels}
            isStreaming={isStreaming}
          />
        ) : hasContent ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : null}

        {/* Action bar */}
        {!isStreaming && hasContent && onRegenerate && (
          <ActionBar
            message={message}
            sourcesCount={citedReferences.length}
            drugsCount={drugNodes.length}
            onRegenerate={onRegenerate}
            onOpenSources={() => setPanel({ open: true, tab: "sources" })}
            onOpenDrugs={() => setPanel({ open: true, tab: "drugs" })}
          />
        )}

        {/* Perplexity-style follow-up questions */}
        {!isStreaming && message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold mb-1.5" style={{ color: "#37475E" }}>
              Suggested questions
            </p>
            <div style={{ borderTop: "1px solid #EDF1F5" }}>
              {message.suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onQuestionClick?.(q)}
                  className="flex w-full items-center gap-2 py-2 text-left text-xs cursor-pointer"
                  style={{
                    borderBottom: "1px solid #EDF1F5",
                    color: "#37475E",
                    fontFamily: "Manrope, system-ui, sans-serif",
                  }}
                >
                  <CornerDownRight className="h-3.5 w-3.5 shrink-0" style={{ color: "#8090A6" }} />
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sources/Drugs panel */}
        <SourcesDrugsPanel
          isOpen={panel.open}
          onClose={() => setPanel((p) => ({ ...p, open: false }))}
          activeTab={panel.tab}
          onTabChange={(tab) => setPanel((p) => ({ ...p, tab }))}
          references={citedReferences}
          evidenceLevels={message.evidenceLevels}
          drugNodes={drugNodes}
          showDrugsTab={drugNodes.length > 0}
        />
      </div>
    </div>
  );
}
