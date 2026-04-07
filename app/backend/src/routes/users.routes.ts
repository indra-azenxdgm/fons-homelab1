import { Router } from "express";

import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  resetAdminUserPassword,
  updateAdminUserRole,
} from "@/controllers/users.controller";
import { requireAdminPermission } from "@/middleware/auth";
import { asyncHandler } from "@/utils/async-handler";

export function createUsersRoutes() {
  const router = Router();

  router.get("/admin/users", requireAdminPermission("users.manage"), asyncHandler(getAdminUsers));
  router.post("/admin/users", requireAdminPermission("users.manage"), asyncHandler(createAdminUser));
  router.patch("/admin/users/:userId", requireAdminPermission("users.manage"), asyncHandler(updateAdminUserRole));
  router.delete("/admin/users/:userId", requireAdminPermission("users.manage"), asyncHandler(deleteAdminUser));
  router.post("/admin/users/:userId/reset-password", requireAdminPermission("users.manage"), asyncHandler(resetAdminUserPassword));

  return router;
}
