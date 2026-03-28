"use client";

import { createContext, useContext } from "react";
import type { EhrWriter } from "@/core/types/ehr";

export const EhrWriterContext = createContext<EhrWriter | null>(null);

export function useEhrWriter(): EhrWriter | null {
  return useContext(EhrWriterContext);
}
