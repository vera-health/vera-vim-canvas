"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useVimOS } from "@/integrations/vim/VimProvider";
import { useVimContext } from "@/integrations/vim/hooks/useVimContext";
import { useNotificationPreferences } from "@/core/hooks/useNotificationPreferences";
import type { EhrNotification, NotificationType } from "@/core/types/notification";
import type { VimOrder, VimReferral, VimLabResult } from "@/integrations/vim/types/vim";

// ---------------------------------------------------------------------------
// Suggested-question templates per trigger
// ---------------------------------------------------------------------------

function orderQuestions(order: VimOrder): string[] {
  const name = order.basicInformation?.orderName ?? "this order";
  const type = order.basicInformation?.type;

  if (name.toLowerCase().includes("ekg")) {
    return [
      "What's this patient's cardiac history?",
      "Are they rate-controlled on their current meds?",
      "Any prior EKG results to compare?",
    ];
  }

  const q1 = `Any contraindications for ${name} given their meds?`;
  const q2 =
    type === "RX"
      ? `Check drug interactions for ${name} with current medications`
      : `What's the latest creatinine?`;
  const q3 =
    type === "DI"
      ? "Prior imaging results?"
      : type === "LAB"
        ? "How should I interpret the results when they come back?"
        : `Review this ${type ?? ""} order for ${name}`;
  return [q1, q2, q3];
}

function labQuestions(_results: VimLabResult[]): string[] {
  return [
    "Interpret these results in context of their problem list",
    "Any critical values?",
    "How does this compare to their last result?",
  ];
}

function referralQuestions(ref: VimReferral): string[] {
  const specialty = ref.basicInformation?.specialty ?? "this specialty";
  return [
    `Generate a consult summary for the receiving ${specialty} specialist`,
    "What's the relevant history for this referral?",
    "Any pending results the consultant should know about?",
  ];
}

// ---------------------------------------------------------------------------
// Default patient-context questions (no active trigger)
// ---------------------------------------------------------------------------

const DEFAULT_QUESTIONS = [
  "Summarize this patient",
  "Any recent ED visits or hospitalizations?",
  "Active alerts or overdue screenings?",
];

const DEFAULT_PROMPT = "Ask Vera anything about your patient";

const TRIGGER_PROMPTS: Record<NotificationType, string> = {
  "order-created": "New order detected — ask Vera about it",
  "new-lab-result": "New results available — ask Vera to interpret",
  "referral-created": "Referral placed — let Vera help with the handoff",
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

interface State {
  notifications: EhrNotification[];
}

type Action =
  | { type: "ADD"; notification: EhrNotification }
  | { type: "MARK_READ"; id: string }
  | { type: "MARK_ALL_READ" }
  | { type: "DISMISS"; id: string }
  | { type: "CLEAR_ALL" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD":
      return {
        notifications: [action.notification, ...state.notifications],
      };
    case "MARK_READ":
      return {
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n,
        ),
      };
    case "MARK_ALL_READ":
      return {
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };
    case "DISMISS":
      return {
        notifications: state.notifications.filter((n) => n.id !== action.id),
      };
    case "CLEAR_ALL":
      return { notifications: [] };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

let idCounter = 0;
function nextId(): string {
  return `notif-${Date.now()}-${++idCounter}`;
}

export function useEhrNotifications() {
  const vimOS = useVimOS();
  const { patient, encounter, orders, referral, labs } = useVimContext();
  const { isEnabled } = useNotificationPreferences();

  const [state, dispatch] = useReducer(reducer, { notifications: [] });

  // Refs for diffing previous state
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const seenOrderIdsRef = useRef<Set<string>>(new Set()); // dedup between onOrderCreated and diff
  const prevReferralIdRef = useRef<string | null>(null);
  const prevLabCountRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Helper to add notification ---
  const addNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      detail: string,
      suggestedQuestions: string[],
      context: Record<string, unknown> = {},
    ) => {
      if (!isEnabled(type)) return;
      dispatch({
        type: "ADD",
        notification: {
          id: nextId(),
          type,
          title,
          detail,
          timestamp: Date.now(),
          read: false,
          suggestedQuestions,
          context,
        },
      });
    },
    [isEnabled],
  );

  // --- Trigger 1: Order created via workflowEvents ---
  useEffect(() => {
    if (!vimOS?.ehr?.workflowEvents?.order?.onOrderCreated) return;
    const unsub = vimOS.ehr.workflowEvents.order.onOrderCreated((order: VimOrder) => {
      const orderId = order.identifiers?.ehrOrderId;
      if (orderId) seenOrderIdsRef.current.add(orderId);
      const name = order.basicInformation?.orderName ?? "Unknown order";
      const type = order.basicInformation?.type ?? "";
      addNotification(
        "order-created",
        `New order: ${name}`,
        `${type} order placed`,
        orderQuestions(order),
        { order },
      );
    });
    return typeof unsub === "function" ? unsub : undefined;
  }, [vimOS, addNotification]);

  // --- Trigger 1 fallback: Detect new orders via subscription diff ---
  useEffect(() => {
    const currentIds = new Set(
      orders
        .map((o) => o.identifiers?.ehrOrderId)
        .filter((id): id is string => !!id),
    );
    const newOrders = orders.filter(
      (o) =>
        o.identifiers?.ehrOrderId &&
        !prevOrderIdsRef.current.has(o.identifiers.ehrOrderId) &&
        !seenOrderIdsRef.current.has(o.identifiers.ehrOrderId),
    );
    // Only fire if we had a previous snapshot (skip initial load)
    if (prevOrderIdsRef.current.size > 0 && newOrders.length > 0) {
      for (const order of newOrders) {
        const orderId = order.identifiers?.ehrOrderId;
        if (orderId) seenOrderIdsRef.current.add(orderId);
        const name = order.basicInformation?.orderName ?? "Unknown order";
        const type = order.basicInformation?.type ?? "";
        addNotification(
          "order-created",
          `New order: ${name}`,
          `${type} order placed`,
          orderQuestions(order),
          { order },
        );
      }
    }
    prevOrderIdsRef.current = currentIds;
  }, [orders, addNotification]);

  // --- Trigger 2: New lab results (poll on encounter change) ---
  useEffect(() => {
    if (!patient || !encounter) return;

    // Debounce: encounter updates can be bursty
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        if (typeof patient.getLabResults !== "function") return;
        const response = await patient.getLabResults();
        const results = Array.isArray(response?.data) ? response.data : [];
        const newCount = results.length;

        if (prevLabCountRef.current > 0 && newCount > prevLabCountRef.current) {
          const newResults = results.slice(0, newCount - prevLabCountRef.current);
          const firstName = newResults[0]?.testName ?? "Lab results";
          addNotification(
            "new-lab-result",
            `New results: ${firstName}`,
            `${newCount - prevLabCountRef.current} new result(s) available`,
            labQuestions(newResults),
            { results: newResults },
          );
        }
        prevLabCountRef.current = newCount;
      } catch {
        // Rate limit or API error — skip
      }
    }, 2000);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [patient, encounter, addNotification]);

  // --- Trigger 3: Referral created ---
  useEffect(() => {
    if (!referral) {
      prevReferralIdRef.current = null;
      return;
    }

    const currentId = referral.identifiers?.ehrReferralId ?? null;
    if (
      prevReferralIdRef.current !== null &&
      currentId !== null &&
      currentId !== prevReferralIdRef.current
    ) {
      const specialty = referral.basicInformation?.specialty ?? "specialist";
      addNotification(
        "referral-created",
        `New referral: ${specialty}`,
        `${referral.basicInformation?.priority ?? "Routine"} referral placed`,
        referralQuestions(referral),
        { referral },
      );
    }
    prevReferralIdRef.current = currentId;
  }, [referral, addNotification]);

  // --- Badge management ---
  const unreadCount = useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications],
  );

  useEffect(() => {
    if (!vimOS?.hub?.notificationBadge) return;
    try {
      if (unreadCount > 0) {
        if (typeof vimOS.hub.notificationBadge.set === "function") {
          vimOS.hub.notificationBadge.set(unreadCount);
        }
      } else {
        if (typeof vimOS.hub.notificationBadge.hide === "function") {
          vimOS.hub.notificationBadge.hide();
        }
      }
    } catch {
      // badge API may not be available in all contexts
    }
  }, [vimOS, unreadCount]);

  // --- Active suggested questions + prompt text ---
  const latestUnread = useMemo(
    () => state.notifications.find((n) => !n.read) ?? null,
    [state.notifications],
  );

  const activeSuggestedQuestions = useMemo(() => {
    if (latestUnread) return latestUnread.suggestedQuestions;
    return DEFAULT_QUESTIONS;
  }, [latestUnread]);

  const activePromptText = useMemo(() => {
    if (latestUnread) return TRIGGER_PROMPTS[latestUnread.type];
    return DEFAULT_PROMPT;
  }, [latestUnread]);

  // --- Actions ---
  const markRead = useCallback((id: string) => dispatch({ type: "MARK_READ", id }), []);
  const markAllRead = useCallback(() => dispatch({ type: "MARK_ALL_READ" }), []);
  const dismiss = useCallback((id: string) => dispatch({ type: "DISMISS", id }), []);

  return {
    notifications: state.notifications,
    unreadCount,
    activeSuggestedQuestions,
    activePromptText,
    markRead,
    markAllRead,
    dismiss,
  };
}
