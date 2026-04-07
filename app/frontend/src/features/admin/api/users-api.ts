import "server-only";

import { fetchAdminApi, toQueryString } from "@/features/admin/api/admin-api";
import type { AdminUserListItem } from "@/features/admin/lib/shared/admin-user-types";

export async function getAdminUsersApi(filters: Record<string, string | undefined>) {
  return fetchAdminApi<{
    items: AdminUserListItem[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>(`/api/admin/users${toQueryString(filters)}`);
}
