import "server-only";

import { fetchBackendJson } from "@/lib/api-client";
import type { BookingDayStatus, TimeSlot } from "@/features/booking/constants";

export async function getPublicBookingFormApi() {
  return fetchBackendJson<{
    defaultDate: string;
    serviceTypes: Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      estimatedDuration: number | null;
    }>;
    initialSlots: Array<{
      value: string;
      label: string;
      available: boolean;
    }>;
    initialDayStatus: BookingDayStatus;
    initialAvailabilityMessage: string | null;
  }>("/api/public/booking-form");
}

export async function getPublicBookingAvailabilityApi(bookingDate: string) {
  const response = await fetchBackendJson<{
    ok: true;
    data: {
      slots: Array<{
        value: string;
        label: string;
        available: boolean;
      }>;
      dayStatus: BookingDayStatus;
      message: string | null;
    };
  }>(`/api/public/booking-availability?date=${encodeURIComponent(bookingDate)}`);

  return response.data;
}

export async function getPublicBookingByCodeApi(bookingCode: string) {
  const response = await fetchBackendJson<{
    booking: {
      bookingCode: string;
      contactName: string;
      bookingDate: Date;
      timeSlot: TimeSlot | string;
      serviceDisplayName: string | null;
      serviceVariant: string | null;
      serviceIssue: string | null;
      serviceComplaint: string | null;
      serviceType: {
        name: string;
      };
    } | null;
  }>(`/api/public/bookings/by-code?code=${encodeURIComponent(bookingCode)}`);

  return response.booking;
}
