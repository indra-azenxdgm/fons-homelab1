import { BookingDayStatus, TimeSlot } from "@prisma/client";

import { getAdminCalendarMonth, getAdminServiceTypes } from "@/features/admin/lib/server/admin-service";
import { setBookingDayOverride } from "@/services/booking-day-overrides.service";
import { setBookingSlotOverride } from "@/services/booking-slot-overrides.service";

export async function getCalendarMonth(filters: Record<string, string | undefined>) {
  return getAdminCalendarMonth(filters);
}

export async function getCalendarServiceTypes() {
  return getAdminServiceTypes();
}

export async function updateCalendarDayOverride(input: {
  date: string;
  status: BookingDayStatus;
  reason?: string | null;
  actingAdminUserId: string;
}) {
  return setBookingDayOverride(input);
}

export async function updateCalendarSlotOverride(input: {
  date: string;
  timeSlot: TimeSlot;
  status: BookingDayStatus;
  reason?: string | null;
  actingAdminUserId: string;
}) {
  return setBookingSlotOverride(input);
}
