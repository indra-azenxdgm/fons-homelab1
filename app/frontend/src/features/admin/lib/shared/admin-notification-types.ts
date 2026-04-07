import type {
  AdminNotificationSeverity,
  AdminNotificationType,
  AdminNotificationRules,
} from "@/features/admin/lib/contracts";

export type AdminNotificationItem = {
  id: string;
  type: AdminNotificationType;
  severity: AdminNotificationSeverity;
  title: string;
  message: string;
  detail: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
  bookingId: string | null;
  archivedAt: Date | null;
  archivedReason: string | null;
  audienceType: string;
  audienceRole: string | null;
};

export type AdminNotificationListResponse = {
  items: AdminNotificationItem[];
  totalCount: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdminNotificationOverviewResponse = {
  insights: {
    unreadCount: number;
    notificationsToday: number;
    newBookingsToday: number;
    statusUpdatesToday: number;
    squadUpdatesToday: number;
    attentionAlertsOpen: number;
    averageReadLatencyMinutes: number | null;
    mostFrequentType: AdminNotificationType | null;
  };
  digest: {
    cadence: "daily" | "weekly";
    daily: {
      title: string;
      periodLabel: string;
      unreadSnapshot: number;
      newBookings: number;
      statusUpdates: number;
      squadUpdates: number;
      attentionAlerts: number;
      highlights: AdminNotificationItem[];
    };
    weekly: {
      title: string;
      periodLabel: string;
      unreadSnapshot: number;
      newBookings: number;
      statusUpdates: number;
      squadUpdates: number;
      attentionAlerts: number;
      highlights: AdminNotificationItem[];
    };
  };
  rules: AdminNotificationRules;
};
