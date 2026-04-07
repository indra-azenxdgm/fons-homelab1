import "server-only";

import { fetchAdminApi, toQueryString } from "@/features/admin/api/admin-api";
import type { AdminCustomerDetail } from "@/features/admin/lib/shared/admin-customer-types";

export async function getAdminCustomersApi(filters: Record<string, string | undefined>) {
  return fetchAdminApi<{
    items: Array<{
      id: string;
      fullName: string;
      phone: string;
      email: string | null;
      _count: {
        bookings: number;
      };
      bookings: Array<{
        bookingDate: Date;
      }>;
    }>;
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>(`/api/admin/customers${toQueryString(filters)}`);
}

export async function getAdminCustomerDetailApi(customerId: string) {
  const response = await fetchAdminApi<{
    customer: AdminCustomerDetail | null;
  }>(`/api/admin/customers/${customerId}`);

  return response.customer;
}
