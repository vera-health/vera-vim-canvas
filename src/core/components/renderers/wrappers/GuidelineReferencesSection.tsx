"use client";

import React from "react";

import type {ReferenceSchema} from "@/core/types/references";
import {findReferenceByUrl} from "@/core/components/renderers/utils";

interface GuidelineReferencesSectionProps {
  citedRefs: Array<{citationNumber: number; url: string}>;
  references: ReferenceSchema[];
}

export const GuidelineReferencesSection: React.FC<GuidelineReferencesSectionProps> = ({
  citedRefs,
  references,
}) => {
  const usedReferences = citedRefs
    .map(({url}) => findReferenceByUrl(url, references))
    .filter((ref): ref is ReferenceSchema => ref !== undefined);

  if (usedReferences.length === 0) return null;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="space-y-2">
        {usedReferences.map((reference, idx) => (
          <div key={reference.id ?? idx} className="text-[13px]">
            <a
              className="font-medium hover:underline" style={{ color: "#1b779b" }}
              href={
                reference.pmid && reference.pmid !== "NA"
                  ? `https://pubmed.ncbi.nlm.nih.gov/${reference.pmid}`
                  : reference.doi && reference.doi !== "NA"
                    ? `https://doi.org/${reference.doi}`
                    : reference.url || ""
              }
              rel="noopener noreferrer"
              target="_blank"
            >
              {reference.title}
            </a>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              {(reference.publicationVenue || reference.journal) && (
                <span className="italic">
                  {reference.publicationVenue?.name || reference.journal}
                </span>
              )}
              {(reference.publicationVenue || reference.journal) &&
                (reference.authors?.[0] || reference.first_author || reference.year) && (
                  <span className="inline-block h-1 w-1 rounded-full bg-gray-300" />
                )}
              {(reference.authors?.[0] || reference.first_author) && (
                <span>
                  {(reference.authors?.[0]?.name || reference.first_author || "").split(" ").pop()}{" "}
                  et al.
                </span>
              )}
              {(reference.authors?.[0] || reference.first_author) && reference.year && (
                <span className="inline-block h-1 w-1 rounded-full bg-gray-300" />
              )}
              {reference.year && <span>{reference.year}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
