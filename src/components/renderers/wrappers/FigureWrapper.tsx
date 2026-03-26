"use client";

import {ChevronUp, ChevronDown, ZoomIn} from "lucide-react";
import React, {useState} from "react";

import type {ThreadFigureSchema} from "@/types/references";
import type {VeraFigure} from "@/types/customAST";

interface FigureWrapperProps {
  node: VeraFigure;
  figuresMetadata?: ThreadFigureSchema[];
}

export const FigureWrapper: React.FC<FigureWrapperProps> = ({node, figuresMetadata = []}) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Try to find matching metadata from figuresMetadata array
  const metadata = figuresMetadata.find((fig) => {
    if (!fig.url) return false;
    if (fig.url === node.url) return true;
    const cleanFigureUrl = fig.url.toLowerCase().replace(/\?.*$/, "");
    const cleanTargetUrl = node.url.toLowerCase().replace(/\?.*$/, "");
    return (
      cleanFigureUrl.includes(cleanTargetUrl) ||
      cleanTargetUrl.includes(cleanFigureUrl) ||
      cleanFigureUrl.split("/").pop() === cleanTargetUrl.split("/").pop()
    );
  });

  const title = metadata?.title || node.alt;
  const source = metadata?.source;
  const journal = metadata?.journal;
  const year = metadata?.year;
  const author =
    metadata?.authors && Array.isArray(metadata.authors) && metadata.authors.length > 0
      ? metadata.authors[0]
      : undefined;
  const notes = metadata?.notes;
  const key_data = metadata?.keyData;
  const purpose = metadata?.purpose;
  const doi_url = metadata?.doiUrl;

  return (
    <div className="mx-auto my-4 w-full max-w-2xl">
      {/* Header */}
      <div className="rounded-t-lg border-b border-dashed border-gray-200 bg-gray-50 px-3 py-2">
        <div className="flex w-full items-center justify-between">
          <span className="flex items-center text-sm font-medium text-gray-700">
            {journal || "Medical Figure"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-hidden rounded-b-md border-x border-b border-gray-200 bg-gray-50 p-0">
        <div className="m-0.5 p-0.5">
          {/* Image container */}
          <div className="m-0 flex justify-center bg-gray-50 p-0">
            <button
              aria-label="Expand image"
              className="group relative m-0 w-full cursor-pointer border-0 bg-transparent p-0"
              onClick={() => setIsLightboxOpen(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={node.alt || title || "Medical figure"}
                className="max-w-full transition-all duration-200 group-hover:opacity-95"
                src={node.url}
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: "90vh",
                  objectFit: "contain",
                  display: "block",
                  marginTop: 0,
                  marginBottom: "0.5rem",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="flex flex-col items-center rounded-lg bg-black/50 p-3 backdrop-blur-sm">
                  <ZoomIn className="h-6 w-6 text-white" />
                  <span className="mt-1 text-sm font-medium text-white">Click to expand</span>
                </div>
              </div>
            </button>
          </div>

          {/* Caption */}
          {title && (
            <div className="mt-2 bg-gray-50 px-4 py-0 text-left">
              <p className="mb-2 text-sm text-gray-900">
                <span className="font-normal">Figure: </span>
                <span className="font-medium">{title}</span>
              </p>
            </div>
          )}

          {/* Paper details */}
          {(source || journal || author || year || purpose || notes || key_data) && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
              <div className="space-y-2">
                {source && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase text-gray-500">Reference</p>
                    {doi_url ? (
                      <a
                        className="text-sm font-medium text-teal-700 no-underline hover:underline"
                        href={doi_url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {source}
                      </a>
                    ) : (
                      <p className="text-sm font-medium">{source}</p>
                    )}
                  </div>
                )}

                {(journal || author || year) && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {journal && <span className="italic">{journal}</span>}
                    {journal && (author || year) && (
                      <span className="inline-block h-1 w-1 rounded-full bg-gray-300" />
                    )}
                    {author && <span>{author}</span>}
                    {author && year && (
                      <span className="inline-block h-1 w-1 rounded-full bg-gray-300" />
                    )}
                    {year && <span>{year}</span>}
                  </div>
                )}

                {purpose && (
                  <p className={`text-sm text-gray-500 ${isExpanded ? "" : "line-clamp-2"}`}>
                    {purpose}
                  </p>
                )}

                {purpose && purpose.length > 100 && (
                  <div className="flex justify-end">
                    <button
                      className="flex items-center text-xs text-teal-700 transition-colors duration-200 hover:text-teal-900"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsExpanded(!isExpanded);
                      }}
                    >
                      {isExpanded ? (
                        <>
                          Show less <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          Show more <ChevronDown size={14} />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {isExpanded && (
                  <div className="pt-0">
                    {notes && (
                      <div className="mt-0">
                        <h4 className="text-xs font-semibold uppercase text-gray-500">Notes</h4>
                        <p className="text-sm text-gray-500">{notes}</p>
                      </div>
                    )}
                    {key_data && (
                      <div className="mt-1">
                        <h4 className="text-xs font-semibold uppercase text-gray-500">
                          Key Findings
                        </h4>
                        <p className="text-sm text-gray-500">{key_data}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Lightbox */}
        {isLightboxOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={node.alt || title || "Medical figure"}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              src={node.url}
            />
          </div>
        )}
      </div>
    </div>
  );
};
