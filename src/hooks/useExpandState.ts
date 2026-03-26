"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "vera-expanded";

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function write(expanded: boolean) {
  localStorage.setItem(STORAGE_KEY, String(expanded));
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

let cache: boolean | null = null;

function subscribe(onStoreChange: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      cache = null;
      onStoreChange();
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getSnapshot(): boolean {
  if (cache === null) cache = read();
  return cache;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useExpandState() {
  const expanded = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = !read();
    cache = null;
    write(next);
  }, []);

  return { expanded, toggle };
}
