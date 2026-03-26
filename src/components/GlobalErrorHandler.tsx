"use client";

import { useEffect } from "react";

/**
 * Catches unhandled errors and promise rejections that would otherwise
 * silently crash the page in the Vim Canvas webview.
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      console.error("[Vera] Unhandled error:", event.error ?? event.message);
    }

    function onRejection(event: PromiseRejectionEvent) {
      console.error("[Vera] Unhandled promise rejection:", event.reason);
      // Prevent the browser from treating this as a fatal crash
      event.preventDefault();
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
