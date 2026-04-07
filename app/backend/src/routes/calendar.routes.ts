import { Router } from "express";

import { getAdminCalendar, getAdminServiceTypes } from "@/controllers/calendar.controller";
import { requireAdminPermission } from "@/middleware/auth";
import { asyncHandler } from "@/utils/async-handler";

export function createCalendarRoutes() {
  const router = Router();

  router.get("/admin/calendar", requireAdminPermission("dashboard.read"), asyncHandler(getAdminCalendar));
  router.get("/admin/service-types", requireAdminPermission("bookings.read"), asyncHandler(getAdminServiceTypes));

  return router;
}
