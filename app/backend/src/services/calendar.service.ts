import { getAdminCalendarMonth, getAdminServiceTypes } from "@/features/admin/lib/server/admin-service";
import { setBookingDayOverride } from "@/services/booking-day-overrides.service";

export async function getCalendarMonth(filters: Record<string, string | undefined>) {
  return getAdminCalendarMonth(filters);
}

export async function getCalendarServiceTypes() {
  return getAdminServiceTypes();
}

export async function updateCalendarDayOverride(input: {
  date: string;
  status: "OPEN" | "FULL_BOOKED" | "CLOSED";
  reason?: string | null;
  actingAdminUserId: string;
}) {
  return setBookingDayOverride(input);
}
