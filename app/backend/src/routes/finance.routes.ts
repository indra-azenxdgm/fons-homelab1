import { Router } from "express";

import {
  getFinanceBookingLookup,
  getFinanceOverviewSummary,
  getFinanceExpenseDetail,
  getFinanceExpenseExport,
  getFinanceExpenseList,
  getFinanceIncomeDetail,
  getFinanceIncomeExport,
  getFinanceIncomeList,
  patchFinanceExpense,
  patchFinanceIncome,
  postFinanceExpense,
  postFinanceIncome,
  removeFinanceExpense,
  removeFinanceIncome,
} from "@/controllers/finance.controller";
import { requireAdminPermission } from "@/middleware/auth";
import { asyncHandler } from "@/utils/async-handler";

export function createFinanceRoutes() {
  const router = Router();

  router.get("/admin/finance/overview", requireAdminPermission("finance.read"), asyncHandler(getFinanceOverviewSummary));
  router.get("/admin/finance/bookings", requireAdminPermission("finance.read"), asyncHandler(getFinanceBookingLookup));

  router.get("/admin/finance/income", requireAdminPermission("finance.read"), asyncHandler(getFinanceIncomeList));
  router.get("/admin/finance/income/export", requireAdminPermission("finance.read"), asyncHandler(getFinanceIncomeExport));
  router.get("/admin/finance/income/:incomeId", requireAdminPermission("finance.read"), asyncHandler(getFinanceIncomeDetail));
  router.post("/admin/finance/income", requireAdminPermission("finance.manage"), asyncHandler(postFinanceIncome));
  router.patch("/admin/finance/income/:incomeId", requireAdminPermission("finance.manage"), asyncHandler(patchFinanceIncome));
  router.delete("/admin/finance/income/:incomeId", requireAdminPermission("finance.manage"), asyncHandler(removeFinanceIncome));

  router.get("/admin/finance/expenses", requireAdminPermission("finance.read"), asyncHandler(getFinanceExpenseList));
  router.get("/admin/finance/expenses/export", requireAdminPermission("finance.read"), asyncHandler(getFinanceExpenseExport));
  router.get("/admin/finance/expenses/:expenseId", requireAdminPermission("finance.read"), asyncHandler(getFinanceExpenseDetail));
  router.post("/admin/finance/expenses", requireAdminPermission("finance.manage"), asyncHandler(postFinanceExpense));
  router.patch("/admin/finance/expenses/:expenseId", requireAdminPermission("finance.manage"), asyncHandler(patchFinanceExpense));
  router.delete("/admin/finance/expenses/:expenseId", requireAdminPermission("finance.manage"), asyncHandler(removeFinanceExpense));

  return router;
}
