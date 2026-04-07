import { Router } from "express";

import { changePassword, login, logout, me } from "@/controllers/auth.controller";
import { requireAdminAuth } from "@/middleware/auth";
import { asyncHandler } from "@/utils/async-handler";

export function createAuthRoutes() {
  const router = Router();

  router.post("/admin/auth/login", asyncHandler(login));
  router.get("/admin/auth/me", asyncHandler(me));
  router.post("/admin/auth/change-password", requireAdminAuth(), asyncHandler(changePassword));
  router.post("/admin/auth/logout", asyncHandler(logout));

  return router;
}
