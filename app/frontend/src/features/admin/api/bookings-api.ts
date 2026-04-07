import "server-only";

import { fetchAdminApi, toQueryString } from "@/features/admin/api/admin-api";
import type { BookingStatus, TimeSlot } from "@/features/booking/constants";
import type {
  AdminBookingDetail,
  ServiceTypeOption,
  SquadOption,
} from "@/features/admin/lib/shared/admin-booking-types";

export type { AdminBookingDetail, ServiceTypeOption, SquadOption };

export async function getAdminBookingsApi(filters: Record<string, string | undefined>) {
  return fetchAdminApi<{
    items: Array<{
      id: string;
      bookingCode: string;
      bookingDate: Date;
      timeSlot: TimeSlot | string;
      contactName: string;
      contactPhone: string;
      status: BookingStatus;
      serviceDisplayName: string | null;
      serviceVariant: string | null;
      serviceIssue: string | null;
      serviceComplaint: string | null;
      serviceType: {
        name: string;
      };
      assignedSquads: SquadOption[];
    }>;
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    squads: SquadOption[];
    serviceTypes: ServiceTypeOption[];
    statusOptions: string[];
  }>(`/api/admin/bookings${toQueryString(filters)}`);
}

export async function getAdminBookingDetailApi(bookingId: string) {
  return fetchAdminApi<{
    booking: AdminBookingDetail | null;
    squads: SquadOption[];
    statusOptions: string[];
  }>(`/api/admin/bookings/${bookingId}`);
}
