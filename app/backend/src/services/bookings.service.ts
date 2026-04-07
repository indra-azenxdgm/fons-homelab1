import {
  bookingStatusOptions,
  getAdminBookingDetail,
  getAdminBookings,
  getAdminDashboardOverview,
  getAdminServiceTypes,
  updateAdminBooking,
} from "@/features/admin/lib/server/admin-service";
import {
  BookingCapacityError,
  BookingDuplicateActiveError,
  BookingValidationError,
  createBooking,
  getAvailableSlots,
  getBookingByCode,
  getBookingBySubmissionKey,
  getDefaultBookingDate,
  getServiceTypes,
} from "@/features/booking/lib/booking-service";
import { bookingSchema } from "@/features/booking/lib/booking-schema";

export async function getBookingFormData() {
  const defaultDate = getDefaultBookingDate();
  const [serviceTypes, initialSlots] = await Promise.all([
    getServiceTypes(),
    getAvailableSlots(defaultDate),
  ]);

  return {
    defaultDate,
    serviceTypes,
    initialSlots,
  };
}

export {
  bookingSchema,
  bookingStatusOptions,
  BookingCapacityError,
  BookingDuplicateActiveError,
  BookingValidationError,
  createBooking,
  getAdminBookingDetail,
  getAdminBookings,
  getAdminDashboardOverview,
  getAdminServiceTypes,
  getAvailableSlots,
  getBookingByCode,
  getBookingBySubmissionKey,
  updateAdminBooking,
};
