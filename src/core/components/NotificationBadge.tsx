"use client";

import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationBadgeProps {
  unreadCount: number;
  onClick: () => void;
}

export function NotificationBadge({ unreadCount, onClick }: NotificationBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
      style={{ color: "#687076" }}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <Bell className="h-4 w-4" />
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none"
            style={{ backgroundColor: "#E53E3E", color: "#FFFFFF" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
