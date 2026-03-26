"use client";

import { Stethoscope, FlaskConical, ArrowRightLeft, CornerDownRight, CheckCheck } from "lucide-react";
import type { EhrNotification, NotificationType } from "@/types/notification";

const ICONS: Record<NotificationType, React.ElementType> = {
  "order-created": Stethoscope,
  "new-lab-result": FlaskConical,
  "referral-created": ArrowRightLeft,
};

const ICON_COLORS: Record<NotificationType, string> = {
  "order-created": "#486081",
  "new-lab-result": "#2B7A78",
  "referral-created": "#6B46C1",
};

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface NotificationPanelProps {
  notifications: EhrNotification[];
  onQuestionClick: (question: string, notificationId: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationPanel({
  notifications,
  onQuestionClick,
  onMarkAllRead,
}: NotificationPanelProps) {
  if (notifications.length === 0) {
    return (
      <div
        className="absolute right-0 z-50 mt-1 w-72 rounded-xl border py-3"
        style={{
          top: "100%",
          backgroundColor: "#fff",
          borderColor: "#EDF2F7",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        <p
          className="text-center text-sm"
          style={{ color: "#8090A6", fontFamily: "Manrope, system-ui, sans-serif" }}
        >
          No notifications
        </p>
      </div>
    );
  }

  return (
    <div
      className="absolute right-0 z-50 mt-1 w-80 rounded-xl border"
      style={{
        top: "100%",
        backgroundColor: "#fff",
        borderColor: "#EDF2F7",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        maxHeight: 420,
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: "1px solid #EDF2F7" }}
      >
        <span
          className="text-xs font-semibold"
          style={{ color: "#37475E", fontFamily: "Manrope, system-ui, sans-serif" }}
        >
          Notifications
        </span>
        <button
          type="button"
          onClick={onMarkAllRead}
          className="flex items-center gap-1 text-xs transition-colors hover:opacity-70"
          style={{ color: "#486081", fontFamily: "Manrope, system-ui, sans-serif" }}
        >
          <CheckCheck className="h-3 w-3" />
          Mark all read
        </button>
      </div>

      {/* Notification list */}
      {notifications.map((n) => {
        const Icon = ICONS[n.type];
        const iconColor = ICON_COLORS[n.type];
        return (
          <div
            key={n.id}
            className="px-3 py-2.5"
            style={{
              borderBottom: "1px solid #EDF2F7",
              backgroundColor: n.read ? "#fff" : "#F7FAFC",
            }}
          >
            <div className="flex items-start gap-2">
              <div
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${iconColor}14` }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="truncate text-sm font-medium"
                    style={{
                      color: "#37475E",
                      fontFamily: "Manrope, system-ui, sans-serif",
                    }}
                  >
                    {n.title}
                  </span>
                  <span
                    className="shrink-0 text-[10px]"
                    style={{ color: "#8090A6" }}
                  >
                    {timeAgo(n.timestamp)}
                  </span>
                </div>
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: "#8090A6", fontFamily: "Manrope, system-ui, sans-serif" }}
                >
                  {n.detail}
                </p>

                {/* Suggested questions for this notification */}
                <div className="mt-1.5 flex flex-col gap-0.5">
                  {n.suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => onQuestionClick(q, n.id)}
                      className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-xs transition-colors hover:bg-gray-50"
                      style={{
                        color: "#486081",
                        fontFamily: "Manrope, system-ui, sans-serif",
                      }}
                    >
                      <CornerDownRight className="h-3 w-3 shrink-0" style={{ color: "#8090A6" }} />
                      <span className="line-clamp-1">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Unread dot */}
            {!n.read && (
              <div className="absolute right-3 top-3 h-2 w-2 rounded-full" style={{ backgroundColor: "#486081" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
