export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "SQUAD";

export type AdminNotificationType =
  | "BOOKING_CREATED"
  | "BOOKING_STATUS_CHANGED"
  | "BOOKING_SQUADS_UPDATED"
  | "BOOKING_ATTENTION_REQUIRED";

export type AdminNotificationSeverity = "info" | "warning" | "critical";

export type AdminNotificationPreferences = {
  toastEnabled: boolean;
  soundEnabled: boolean;
  typePreferences: Record<AdminNotificationType, boolean>;
};

export type AdminNotificationRules = {
  digestCadence: "daily" | "weekly";
  eventTypeEnabled: Record<AdminNotificationType, boolean>;
  sla: {
    enabled: boolean;
    pendingHours: number;
    confirmedHours: number;
    assignedHours: number;
    inProgressHours: number;
  };
};

export type AdminPermission =
  | "dashboard.read"
  | "bookings.read"
  | "bookings.update"
  | "finance.read"
  | "finance.manage"
  | "customers.read"
  | "squads.read"
  | "squads.manage"
  | "reports.read"
  | "settings.manage"
  | "users.manage";

export type AdminNavigationIcon =
  | "layout-dashboard"
  | "clipboard-list"
  | "calendar-range"
  | "wallet"
  | "users"
  | "user-round"
  | "shield-user";

export type AdminNavigationItem = {
  href: string;
  label: string;
  icon: AdminNavigationIcon;
  permission: AdminPermission;
  matchMode: "exact" | "prefix";
};

export type AdminShellUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  availableNotificationTypes: AdminNotificationType[];
  notificationPreferences: AdminNotificationPreferences;
  mustChangePassword: boolean;
};
