export type NotificationType =
  | "order-created"
  | "new-lab-result"
  | "referral-created";

export interface EhrNotification {
  id: string;
  type: NotificationType;
  title: string;
  detail: string;
  timestamp: number;
  read: boolean;
  suggestedQuestions: string[];
  context: Record<string, unknown>;
}

export interface NotificationPreferences {
  enabled: Record<NotificationType, boolean>;
}

export const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  "order-created",
  "new-lab-result",
  "referral-created",
];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  "order-created": "New orders",
  "new-lab-result": "Lab / imaging results",
  "referral-created": "Referrals & consults",
};
