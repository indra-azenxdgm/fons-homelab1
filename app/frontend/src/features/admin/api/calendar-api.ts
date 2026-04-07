import "server-only";

import { fetchAdminApi, toQueryString } from "@/features/admin/api/admin-api";
import type { ServiceTypeOption, SquadOption } from "@/features/admin/api/bookings-api";
import type { BookingStatus, TimeSlot } from "@/features/booking/constants";

export async function getAdminCalendarMonthApi(filters: Record<string, string | undefined>) {
  return fetchAdminApi<{
    monthStart: Date;
    selectedDate: Date;
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
