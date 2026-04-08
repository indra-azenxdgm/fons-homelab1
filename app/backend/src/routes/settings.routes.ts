import { Router } from "express";

import {
  getAdminCompanyProfile,
  postAdminOperationalDataWipe,
  patchAdminCompanyProfile,
} from "@/controllers/settings.controller";
import { requireAdminPermission } from "@/middleware/auth";
import { asyncHandler } from "@/utils/async-handler";

export function createSettingsRoutes() {
  const router = Router();

  router.get("/admin/settings/company-profile", requireAdminPermission("settings.manage"), asyncHandler(getAdminCompanyProfile));
  router.patch("/admin/settings/company-profile", requireAdminPermission("settings.manage"), asyncHandler(patchAdminCompanyProfile));
  router.post("/admin/settings/operational-data/wipe", requireAdminPermission("settings.manage"), asyncHandler(postAdminOperationalDataWipe));

  return router;
}
