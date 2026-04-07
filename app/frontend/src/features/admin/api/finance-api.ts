import "server-only";

import { fetchAdminApi, toQueryString } from "@/features/admin/api/admin-api";
import type {
  AdminExpenseListItem,
  AdminFinanceBookingLookupItem,
  AdminIncomeListItem,
} from "@/features/admin/lib/shared/admin-finance-types";
import type { AdminFinanceOverview, FinanceOverviewPeriod } from "@/features/admin/lib/shared/admin-finance-overview-types";

export async function getAdminFinanceBookingsApi(filters: Record<string, string | undefined>) {
  return fetchAdminApi<{
    items: AdminFinanceBookingLookupItem[];
  }>(`/api/admin/finance/bookings${toQueryString(filters)}`);
}

export async function getAdminFinanceOverviewApi(filters: { period?: FinanceOverviewPeriod }) {
  return fetchAdminApi<AdminFinanceOverview>(`/api/admin/finance/overview${toQueryString(filters)}`);
}

export async function getAdminIncomeApi(filters: Record<string, string | undefined>) {
  return fetchAdminApi<{
    items: AdminIncomeListItem[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>(`/api/admin/finance/income${toQueryString(filters)}`);
}

export async function getAdminExpensesApi(filters: Record<string, string | undefined>) {
  return fetchAdminApi<{
    items: AdminExpenseListItem[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>(`/api/admin/finance/expenses${toQueryString(filters)}`);
}
