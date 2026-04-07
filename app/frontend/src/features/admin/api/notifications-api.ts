import "server-only";

import { fetchAdminApi, toQueryString } from "@/features/admin/api/admin-api";
import type { AdminNotificationRules } from "@/features/admin/lib/contracts";
import type {
  AdminNotificationListResponse,
  AdminNotificationOverviewResponse,
} from "@/features/admin/lib/shared/admin-notification-types";

export async function getAdminNotificationsApi(filters: {
  status?: "read" | "unread";
  view?: "active" | "archived";
  limit?: number;
  page?: number;
} = {}) {
  return fetchAdminApi<AdminNotificationListResponse>(
    `/api/admin/notifications${toQueryString({
      status: filters.status,
      view: filters.view,
      limit: filters.limit ? String(filters.limit) : undefined,
      page: filters.page ? String(filters.page) : undefined,
    })}`,
  );
}

export async function getAdminNotificationOverviewApi() {
  return fetchAdminApi<AdminNotificationOverviewResponse>("/api/admin/notifications/overview");
}

export async function getAdminNotificationRulesApi() {
  return fetchAdminApi<{
    rules: AdminNotificationRules;
  }>("/api/admin/notifications/rules");
}
