import { Router } from "express";

import {
  createAdminSquad,
  getAdminSquad,
  getAdminSquadLookup,
  getAdminSquads,
} from "@/controllers/squads.controller";
import { requireAdminPermission } from "@/middleware/auth";
import { asyncHandler } from "@/utils/async-handler";

export function createSquadsRoutes() {
  const router = Router();

  router.get("/admin/squads", requireAdminPermission("squads.read"), asyncHandler(getAdminSquads));
  router.get("/admin/squads/lookup", requireAdminPermission("bookings.read"), asyncHandler(getAdminSquadLookup));
  router.post("/admin/squads", requireAdminPermission("squads.manage"), asyncHandler(createAdminSquad));
  router.get("/admin/squads/:squadId", requireAdminPermission("squads.read"), asyncHandler(getAdminSquad));

  return router;
}
