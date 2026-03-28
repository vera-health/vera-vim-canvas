"use client";

import { createContext, useContext } from "react";

interface AppSizeValue {
  canResize: boolean;
}

export const AppSizeContext = createContext<AppSizeValue>({ canResize: false });

export function useAppSize(): AppSizeValue {
  return useContext(AppSizeContext);
}
