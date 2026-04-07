import { Router } from "express";

import {
  getAdminNotificationsOverview,
  getAdminNotificationsRules,
  listAdminNotifications,
  patchAdminNotificationsRules,
  patchAdminNotificationPreferences,
  patchAdminNotificationRead,
  postAdminNotificationsBulkArchive,
  postAdminNotificationsBulkRead,
  postAdminNotificationsBulkRestore,
  postAdminNotificationsReadAll,
} from "@/controllers/notifications.controller";
import { requireAdminPermission } from "@/middleware/auth";
import { asyncHandler } from "@/utils/async-handler";

export function createNotificationsRoutes() {
  const router = Router();

  router.get("/admin/notifications", requireAdminPermission("bookings.read"), asyncHandler(listAdminNotifications));
  router.get("/admin/notifications/overview", requireAdminPermission("bookings.read"), asyncHandler(getAdminNotificationsOverview));
  router.get("/admin/notifications/rules", requireAdminPermission("settings.manage"), asyncHandler(getAdminNotificationsRules));
  router.patch("/admin/notifications/preferences", requireAdminPermission("bookings.read"), asyncHandler(patchAdminNotificationPreferences));
  router.patch("/admin/notifications/rules", requireAdminPermission("settings.manage"), asyncHandler(patchAdminNotificationsRules));
  router.patch("/admin/notifications/:notificationId/read", requireAdminPermission("bookings.read"), asyncHandler(patchAdminNotificationRead));
  router.post("/admin/notifications/read-all", requireAdminPermission("bookings.read"), asyncHandler(postAdminNotificationsReadAll));
  router.post("/admin/notifications/bulk/read", requireAdminPermission("bookings.read"), asyncHandler(postAdminNotificationsBulkRead));
  router.post("/admin/notifications/bulk/archive", requireAdminPermission("bookings.read"), asyncHandler(postAdminNotificationsBulkArchive));
  router.post("/admin/notifications/bulk/restore", requireAdminPermission("bookings.read"), asyncHandler(postAdminNotificationsBulkRestore));

  return router;
}
