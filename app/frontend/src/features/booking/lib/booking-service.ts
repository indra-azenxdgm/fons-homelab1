import "server-only";

import {
  getPublicBookingAvailabilityApi,
  getPublicBookingByCodeApi,
  getPublicBookingFormApi,
} from "@/features/booking/api/bookings-api";
import type { TimeSlot } from "@/features/booking/constants";

export function getDefaultBookingDate() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

export async function getAvailableSlots(bookingDate: string) {
  return getPublicBookingAvailabilityApi(bookingDate);
}

export async function getServiceTypes() {
  const response = await getPublicBookingFormApi();
  return response.serviceTypes;
}

export async function getBookingFormData() {
  return getPublicBookingFormApi();
}

export async function getBookingByCode(bookingCode: string) {
  return getPublicBookingByCodeApi(bookingCode) as Promise<{
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
  } | null>;
}
