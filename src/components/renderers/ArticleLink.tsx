"use client";

import React from "react";

import type {ReferenceSchema} from "@/types/references";
import {sanitizeUrl} from "@/components/renderers/utils";

interface ArticleLinkProps {
  reference: ReferenceSchema | undefined;
  href: string | undefined;
}

export const ArticleLink: React.FC<ArticleLinkProps> = ({reference, href}) => {
  const safeHref = sanitizeUrl(href);

  return (
    <a
      className="not-prose inline-block pt-1 align-top"
      href={safeHref}
      rel="noopener noreferrer"
      target="_blank"
      title={reference?.title}
    >
      <span
        className="ml-1 flex h-6 flex-row items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold leading-3"
        style={{
          backgroundColor: "rgba(72, 96, 129, 0.2)",
          color: "#486081",
          fontFamily: "Manrope",
        }}
      >
        Article
      </span>
    </a>
  );
};
