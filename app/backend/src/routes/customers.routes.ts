import { Router } from "express";

import { getAdminCustomer, getAdminCustomers } from "@/controllers/customers.controller";
import { requireAdminPermission } from "@/middleware/auth";
import { asyncHandler } from "@/utils/async-handler";

export function createCustomersRoutes() {
  const router = Router();

  router.get("/admin/customers", requireAdminPermission("customers.read"), asyncHandler(getAdminCustomers));
  router.get("/admin/customers/:customerId", requireAdminPermission("customers.read"), asyncHandler(getAdminCustomer));

  return router;
}
