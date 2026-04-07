import { getAdminCalendarMonth, getAdminServiceTypes } from "@/features/admin/lib/server/admin-service";

export async function getCalendarMonth(filters: Record<string, string | undefined>) {
  return getAdminCalendarMonth(filters);
}

export async function getCalendarServiceTypes() {
  return getAdminServiceTypes();
}
