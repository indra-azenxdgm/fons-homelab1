import { getAdminCustomerDetail, getAdminCustomers } from "@/features/admin/lib/server/admin-service";

export async function listCustomers(filters: Record<string, string | undefined>) {
  return getAdminCustomers(filters);
}

export async function getCustomerDetail(customerId: string) {
  return getAdminCustomerDetail(customerId);
}
