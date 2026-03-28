"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { NotificationType, NotificationPreferences } from "@/core/types/notification";
import { ALL_NOTIFICATION_TYPES } from "@/core/types/notification";

const STORAGE_KEY = "vera-notification-prefs";

function getDefaults(): NotificationPreferences {
  return {
    enabled: Object.fromEntries(ALL_NOTIFICATION_TYPES.map((t) => [t, true])) as Record<NotificationType, boolean>,
  };
}

function read(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaults();
    const parsed = JSON.parse(raw) as NotificationPreferences;
    // Ensure all types exist (forward-compat)
    const defaults = getDefaults();
    for (const t of ALL_NOTIFICATION_TYPES) {
      if (typeof parsed.enabled[t] !== "boolean") {
        parsed.enabled[t] = defaults.enabled[t];
      }
    }
    return parsed;
  } catch {
    return getDefaults();
  }
}

function write(prefs: NotificationPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  // Notify other subscribers in same tab
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

// External store for useSyncExternalStore
let cache: NotificationPreferences | null = null;

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

function getSnapshot(): NotificationPreferences {
  if (!cache) cache = read();
  return cache;
}

function getServerSnapshot(): NotificationPreferences {
  return getDefaults();
}

export function useNotificationPreferences() {
  const preferences = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleType = useCallback((type: NotificationType) => {
    const current = read();
    current.enabled[type] = !current.enabled[type];
    cache = null;
    write(current);
  }, []);

  const isEnabled = useCallback(
    (type: NotificationType) => preferences.enabled[type] ?? true,
    [preferences],
  );

  return { preferences, toggleType, isEnabled };
}
