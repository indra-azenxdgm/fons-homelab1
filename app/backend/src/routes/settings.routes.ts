import { Router } from "express";

import {
  getAdminCompanyProfile,
  patchAdminCompanyProfile,
} from "@/controllers/settings.controller";
import { requireAdminPermission } from "@/middleware/auth";
import { asyncHandler } from "@/utils/async-handler";

export function createSettingsRoutes() {
  const router = Router();

  router.get("/admin/settings/company-profile", requireAdminPermission("settings.manage"), asyncHandler(getAdminCompanyProfile));
  router.patch("/admin/settings/company-profile", requireAdminPermission("settings.manage"), asyncHandler(patchAdminCompanyProfile));

  return router;
}
