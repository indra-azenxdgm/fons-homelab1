"use client";

import { BackendApiError, fetchBackendJson } from "@/lib/api-client";
import type {
  AdminNotificationRules,
  AdminNotificationPreferences,
  AdminNotificationType,
} from "@/features/admin/lib/contracts";
import type {
  AdminNotificationListResponse,
  AdminNotificationOverviewResponse,
} from "@/features/admin/lib/shared/admin-notification-types";

function getFrontendOrigin() {
  return window.location.origin;
}

export async function getAdminNotificationsBrowser(filters: {
  status?: "read" | "unread";
  view?: "active" | "archived";
  limit?: number;
  page?: number;
} = {}) {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.view) {
    params.set("view", filters.view);
  }

  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }

  if (filters.page) {
    params.set("page", String(filters.page));
  }

  const query = params.toString();

  return fetchBackendJson<AdminNotificationListResponse>(
    `/api/admin/notifications${query ? `?${query}` : ""}`,
    {
      baseUrl: getFrontendOrigin(),
    },
  );
}

export async function markAdminNotificationReadBrowser(notificationId: string) {
  return fetchBackendJson<{
    success: true;
    notification: AdminNotificationListResponse["items"][number];
  }>(`/api/admin/notifications/${notificationId}/read`, {
    baseUrl: getFrontendOrigin(),
    method: "PATCH",
  });
}

export async function markAllAdminNotificationsReadBrowser() {
  return fetchBackendJson<{
    success: true;
    updatedCount: number;
    unreadCount: number;
  }>("/api/admin/notifications/read-all", {
    baseUrl: getFrontendOrigin(),
    method: "POST",
  });
}

export async function bulkMarkAdminNotificationsReadBrowser(ids: string[]) {
  return fetchBackendJson<{
    success: true;
    updatedCount: number;
    unreadCount: number;
  }>("/api/admin/notifications/bulk/read", {
    baseUrl: getFrontendOrigin(),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });
}

export async function bulkArchiveAdminNotificationsBrowser(input: {
  ids?: string[];
  readOnly?: boolean;
}) {
  return fetchBackendJson<{
    success: true;
    updatedCount: number;
    unreadCount: number;
  }>("/api/admin/notifications/bulk/archive", {
    baseUrl: getFrontendOrigin(),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ids: input.ids ?? [],
      readOnly: input.readOnly ?? false,
    }),
  });
}

export async function bulkRestoreAdminNotificationsBrowser(ids: string[]) {
  return fetchBackendJson<{
    success: true;
    updatedCount: number;
    unreadCount: number;
  }>("/api/admin/notifications/bulk/restore", {
    baseUrl: getFrontendOrigin(),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });
}

export async function updateAdminNotificationPreferencesBrowser(input: {
  toastEnabled: boolean;
  soundEnabled: boolean;
  typePreferences: Partial<Record<AdminNotificationType, boolean>>;
}) {
  return fetchBackendJson<{
    success: true;
    availableNotificationTypes: AdminNotificationType[];
    notificationPreferences: AdminNotificationPreferences;
  }>("/api/admin/notifications/preferences", {
    baseUrl: getFrontendOrigin(),
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function getAdminNotificationOverviewBrowser() {
  return fetchBackendJson<AdminNotificationOverviewResponse>("/api/admin/notifications/overview", {
    baseUrl: getFrontendOrigin(),
  });
}

export async function updateAdminNotificationRulesBrowser(input: AdminNotificationRules) {
  return fetchBackendJson<{
    success: true;
    rules: AdminNotificationRules;
  }>("/api/admin/notifications/rules", {
    baseUrl: getFrontendOrigin(),
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export { BackendApiError };
