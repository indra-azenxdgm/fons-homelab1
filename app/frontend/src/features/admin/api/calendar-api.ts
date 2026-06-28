import "server-only";

import { fetchAdminApi, toQueryString } from "@/features/admin/api/admin-api";
import type { ServiceTypeOption, SquadOption } from "@/features/admin/api/bookings-api";
import type { BookingDayStatus, BookingStatus, TimeSlot } from "@/features/booking/constants";

export async function getAdminCalendarMonthApi(filters: Record<string, string | undefined>) {
  return fetchAdminApi<{
    monthStart: Date;
    selectedDate: Date;
    selectedDayOverride: {
      date: string;
      status: BookingDayStatus;
      reason: string | null;
      message: string | null;
    };
    dayOverrides: Array<{
      date: string;
      status: BookingDayStatus;
      reason: string | null;
      message: string | null;
    }>;
    selectedDaySlotOverrides: Array<{
      date: string;
      timeSlot: TimeSlot;
      status: BookingDayStatus;
      reason: string | null;
      message: string | null;
      isManualOverride: boolean;
    }>;
    slotOverrides: Array<{
      date: string;
      timeSlot: TimeSlot;
      status: BookingDayStatus;
      reason: string | null;
      message: string | null;
      isManualOverride: boolean;
    }>;
    bookings: Array<{
      id: string;
      bookingCode: string;
      bookingDate: Date;
      timeSlot: TimeSlot;
      status: BookingStatus;
      contactName: string;
      contactPhone: string;
      serviceTypeId: string;
      serviceDisplayName: string | null;
      serviceVariant: string | null;
      serviceIssue: string | null;
      serviceComplaint: string | null;
      serviceType: {
        name: string;
      };
      assignedSquads: SquadOption[];
    }>;
    serviceTypes: ServiceTypeOption[];
    squads: SquadOption[];
    appliedFilters: {
      q: string;
      month: string;
      day: string;
      view: string;
      status: string;
      assignedSquadId: string;
      serviceTypeId: string;
    };
  }>(`/api/admin/calendar${toQueryString(filters)}`);
}

export async function getAdminServiceTypesApi() {
  const response = await fetchAdminApi<{
    serviceTypes: ServiceTypeOption[];
  }>("/api/admin/service-types");

  return response.serviceTypes;
}

export async function patchAdminCalendarDayOverrideApi(input: {
  date: string;
  status: BookingDayStatus;
  reason?: string | null;
}) {
  return fetchAdminApi<{
    success: true;
    previousStatus: BookingDayStatus;
    override: {
      date: string;
      status: BookingDayStatus;
      reason: string | null;
      message: string | null;
    };
  }>("/api/admin/calendar/day-override", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function patchAdminCalendarSlotOverrideApi(input: {
  date: string;
  timeSlot: TimeSlot;
  status: BookingDayStatus;
  reason?: string | null;
}) {
  return fetchAdminApi<{
    success: true;
    message: string;
    previousStatus: BookingDayStatus;
    isStored: boolean;
    override: {
      date: string;
      timeSlot: TimeSlot;
      status: BookingDayStatus;
      reason: string | null;
      message: string | null;
      isManualOverride: boolean;
    };
  }>("/api/admin/calendar/slot-override", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}
