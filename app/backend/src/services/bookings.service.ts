import {
  bookingStatusOptions,
  getAdminBookingDetail,
  getAdminBookings,
  getAdminDashboardOverview,
  getAdminServiceTypes,
  updateAdminBooking,
} from "@/features/admin/lib/server/admin-service";
import {
  BookingDayUnavailableError,
  BookingCapacityError,
  BookingDuplicateActiveError,
  BookingValidationError,
  createBooking,
  getBookingDateAvailability,
  getAvailableSlots,
  getBookingByCode,
  getBookingBySubmissionKey,
  getDefaultBookingDate,
  getServiceTypes,
} from "@/features/booking/lib/booking-service";
import { bookingSchema } from "@/features/booking/lib/booking-schema";

export async function getBookingFormData() {
  const defaultDate = getDefaultBookingDate();
  const [serviceTypes, initialAvailability] = await Promise.all([
    getServiceTypes(),
    getBookingDateAvailability(defaultDate),
  ]);

  return {
    defaultDate,
    serviceTypes,
    initialSlots: initialAvailability.slots,
    initialDayStatus: initialAvailability.dayStatus,
    initialAvailabilityMessage: initialAvailability.message,
  };
}

export {
  bookingSchema,
  BookingDayUnavailableError,
  bookingStatusOptions,
  BookingCapacityError,
  BookingDuplicateActiveError,
  BookingValidationError,
  createBooking,
  getAdminBookingDetail,
  getAdminBookings,
  getAdminDashboardOverview,
  getAdminServiceTypes,
  getBookingDateAvailability,
  getAvailableSlots,
  getBookingByCode,
  getBookingBySubmissionKey,
  updateAdminBooking,
};
