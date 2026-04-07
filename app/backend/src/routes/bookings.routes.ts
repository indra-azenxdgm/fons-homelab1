import { Router } from "express";

import {
  createPublicBooking,
  getAdminBooking,
  getDashboardOverview,
  getPublicBookingAvailability,
  getPublicBookingByCode,
  getPublicBookingForm,
  listAdminBookings,
  patchAdminBooking,
  reverseGeocode,
} from "@/controllers/bookings.controller";
import { requireAdminPermission } from "@/middleware/auth";
import { asyncHandler } from "@/utils/async-handler";

export function createBookingsRoutes() {
  const router = Router();

  router.get("/public/booking-form", asyncHandler(getPublicBookingForm));
  router.get("/public/bookings/by-code", asyncHandler(getPublicBookingByCode));
  router.get("/public/booking-availability", asyncHandler(getPublicBookingAvailability));
  router.post("/public/bookings", asyncHandler(createPublicBooking));
  router.get("/public/location/reverse-geocode", asyncHandler(reverseGeocode));

  router.get("/admin/dashboard", requireAdminPermission("dashboard.read"), asyncHandler(getDashboardOverview));
  router.get("/admin/bookings", requireAdminPermission("bookings.read"), asyncHandler(listAdminBookings));
  router.get("/admin/bookings/:bookingId", requireAdminPermission("bookings.read"), asyncHandler(getAdminBooking));
  router.patch("/admin/bookings/:bookingId", requireAdminPermission("bookings.update"), asyncHandler(patchAdminBooking));

  return router;
}
