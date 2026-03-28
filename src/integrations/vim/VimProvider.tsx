"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { loadSdk } from "vim-os-js-browser";
import type { VimOS } from "@/integrations/vim/types/vim";

export const VimContext = createContext<VimOS | null>(null);

export function useVimOS() {
  return useContext(VimContext);
}

export function VimProvider({ children }: { children: React.ReactNode }) {
  const [vimOS, setVimOS] = useState<VimOS | null>(null);

  useEffect(() => {
    async function initVim() {
      try {
        const os = (await loadSdk()) as unknown as VimOS;
        if (os?.hub?.setActivationStatus) {
          os.hub.setActivationStatus("ENABLED");
        }
        setVimOS(os);
      } catch (e) {
        console.error("VimOS init failed:", e);
      }
    }
    initVim();
  }, []);

  return <VimContext value={vimOS}>{children}</VimContext>;
}
