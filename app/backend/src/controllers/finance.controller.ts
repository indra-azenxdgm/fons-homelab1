import type { Request, Response } from "express";

import { getRouteParam, mapKnownError, sendApiError, sendZodValidationError } from "@/controllers/controller-helpers";
import { getAuthenticatedAdmin } from "@/middleware/auth";
import {
  createExpenseRecord,
  createIncomeRecord,
  deleteExpenseRecord,
  deleteIncomeRecord,
  exportExpenseRecords,
  getFinanceOverview,
  exportIncomeRecords,
  getExpenseRecord,
  getIncomeRecord,
  listExpenseRecords,
  listFinanceBookings,
  listIncomeRecords,
  updateExpenseRecord,
  updateIncomeRecord,
} from "@/services/finance.service";
import { PdfServiceError } from "@/services/pdf.service";
import type { FinancePaymentMethod } from "@prisma/client";
import {
  financeBookingLookupQuerySchema,
  financeExpenseIdParamSchema,
  financeExpenseListQuerySchema,
  financeExpenseUpsertSchema,
  financeIncomeIdParamSchema,
  financeIncomeListQuerySchema,
  financeIncomeUpsertSchema,
  financeOverviewQuerySchema,
} from "@/validation/api-schemas";

export async function getFinanceOverviewSummary(request: Request, response: Response) {
  const parsedQuery = financeOverviewQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    sendZodValidationError(response, parsedQuery.error, "Finance overview filters are not valid.");
    return;
  }

  response.json(await getFinanceOverview((parsedQuery.data.period as "7D" | "30D" | "3M" | "12M" | undefined) ?? "12M"));
}

export async function getFinanceBookingLookup(request: Request, response: Response) {
  const parsedQuery = financeBookingLookupQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    sendZodValidationError(response, parsedQuery.error, "Finance booking lookup is not valid.");
    return;
  }

  response.json({
    items: await listFinanceBookings({
      q: typeof parsedQuery.data.q === "string" ? parsedQuery.data.q : undefined,
      limit: typeof parsedQuery.data.limit === "number" ? parsedQuery.data.limit : undefined,
    }),
  });
}

export async function getFinanceIncomeList(request: Request, response: Response) {
  const parsedQuery = financeIncomeListQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    sendZodValidationError(response, parsedQuery.error, "Income filters are not valid.");
    return;
  }

  const filters = Object.fromEntries(
    Object.entries(parsedQuery.data).map(([key, value]) => [key, value == null ? undefined : String(value)]),
  ) as Record<string, string | undefined>;

  response.json(await listIncomeRecords(filters));
}

export async function getFinanceIncomeDetail(request: Request, response: Response) {
  const parsedParams = financeIncomeIdParamSchema.safeParse({ incomeId: getRouteParam(request, "incomeId") });

  if (!parsedParams.success) {
    sendZodValidationError(response, parsedParams.error, "Income id is not valid.");
    return;
  }

  try {
    response.json({ item: await getIncomeRecord(parsedParams.data.incomeId) });
  } catch (error) {
    if (!mapKnownError(response, error)) {
      throw error;
    }
  }
}

export async function postFinanceIncome(request: Request, response: Response) {
  const parsedBody = financeIncomeUpsertSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "Income details are not valid.");
    return;
  }

  try {
    const record = await createIncomeRecord(parsedBody.data);
    response.status(201).json({ success: true, record });
  } catch (error) {
    if (!mapKnownError(response, error)) {
      throw error;
    }
  }
}

export async function patchFinanceIncome(request: Request, response: Response) {
  const parsedParams = financeIncomeIdParamSchema.safeParse({ incomeId: getRouteParam(request, "incomeId") });

  if (!parsedParams.success) {
    sendZodValidationError(response, parsedParams.error, "Income id is not valid.");
    return;
  }

  const parsedBody = financeIncomeUpsertSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "Income details are not valid.");
    return;
  }

  try {
    await updateIncomeRecord(parsedParams.data.incomeId, parsedBody.data);
    response.json({ success: true });
  } catch (error) {
    if (!mapKnownError(response, error)) {
      throw error;
    }
  }
}

export async function removeFinanceIncome(request: Request, response: Response) {
  const parsedParams = financeIncomeIdParamSchema.safeParse({ incomeId: getRouteParam(request, "incomeId") });

  if (!parsedParams.success) {
    sendZodValidationError(response, parsedParams.error, "Income id is not valid.");
    return;
  }

  try {
    await deleteIncomeRecord(parsedParams.data.incomeId);
    response.json({ success: true });
  } catch (error) {
    if (!mapKnownError(response, error)) {
      throw error;
    }
  }
}

export async function getFinanceIncomeExport(request: Request, response: Response) {
  const parsedQuery = financeIncomeListQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    sendZodValidationError(response, parsedQuery.error, "Income export filters are not valid.");
    return;
  }

  const adminUser = getAuthenticatedAdmin(response);
  try {
    const file = await exportIncomeRecords({
      q: typeof parsedQuery.data.q === "string" ? parsedQuery.data.q : undefined,
      from: typeof parsedQuery.data.from === "string" ? parsedQuery.data.from : undefined,
      to: typeof parsedQuery.data.to === "string" ? parsedQuery.data.to : undefined,
      paymentMethod: parsedQuery.data.paymentMethod as FinancePaymentMethod | undefined,
      bookingLink: parsedQuery.data.bookingLink as "linked" | "manual" | undefined,
      page: typeof parsedQuery.data.page === "number" ? String(parsedQuery.data.page) : undefined,
    }, (parsedQuery.data.format === "csv" ? "csv" : parsedQuery.data.format === "pdf" ? "pdf" : "xlsx"), {
      preparedBy: adminUser ? { name: adminUser.name, email: adminUser.email } : null,
    });
    response.setHeader("Content-Type", file.contentType);
    response.setHeader("Content-Disposition", `attachment; filename=\"${file.filename}\"`);
    response.send(file.buffer);
  } catch (error) {
    if (error instanceof PdfServiceError) {
      sendApiError(response, {
        status: error.status,
        category: "system",
        code: "pdf_generation_failed",
        message: error.message,
      });
      return;
    }

    throw error;
  }
}

export async function getFinanceExpenseList(request: Request, response: Response) {
  const parsedQuery = financeExpenseListQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    sendZodValidationError(response, parsedQuery.error, "Expense filters are not valid.");
    return;
  }

  const filters = Object.fromEntries(
    Object.entries(parsedQuery.data).map(([key, value]) => [key, value == null ? undefined : String(value)]),
  ) as Record<string, string | undefined>;

  response.json(await listExpenseRecords(filters));
}

export async function getFinanceExpenseDetail(request: Request, response: Response) {
  const parsedParams = financeExpenseIdParamSchema.safeParse({ expenseId: getRouteParam(request, "expenseId") });

  if (!parsedParams.success) {
    sendZodValidationError(response, parsedParams.error, "Expense id is not valid.");
    return;
  }

  try {
    response.json({ item: await getExpenseRecord(parsedParams.data.expenseId) });
  } catch (error) {
    if (!mapKnownError(response, error)) {
      throw error;
    }
  }
}

export async function postFinanceExpense(request: Request, response: Response) {
  const parsedBody = financeExpenseUpsertSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "Expense details are not valid.");
    return;
  }

  try {
    const record = await createExpenseRecord(parsedBody.data);
    response.status(201).json({ success: true, record });
  } catch (error) {
    if (!mapKnownError(response, error)) {
      throw error;
    }
  }
}

export async function patchFinanceExpense(request: Request, response: Response) {
  const parsedParams = financeExpenseIdParamSchema.safeParse({ expenseId: getRouteParam(request, "expenseId") });

  if (!parsedParams.success) {
    sendZodValidationError(response, parsedParams.error, "Expense id is not valid.");
    return;
  }

  const parsedBody = financeExpenseUpsertSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "Expense details are not valid.");
    return;
  }

  try {
    await updateExpenseRecord(parsedParams.data.expenseId, parsedBody.data);
    response.json({ success: true });
  } catch (error) {
    if (!mapKnownError(response, error)) {
      throw error;
    }
  }
}

export async function removeFinanceExpense(request: Request, response: Response) {
  const parsedParams = financeExpenseIdParamSchema.safeParse({ expenseId: getRouteParam(request, "expenseId") });

  if (!parsedParams.success) {
    sendZodValidationError(response, parsedParams.error, "Expense id is not valid.");
    return;
  }

  try {
    await deleteExpenseRecord(parsedParams.data.expenseId);
    response.json({ success: true });
  } catch (error) {
    if (!mapKnownError(response, error)) {
      throw error;
    }
  }
}

export async function getFinanceExpenseExport(request: Request, response: Response) {
  const parsedQuery = financeExpenseListQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    sendZodValidationError(response, parsedQuery.error, "Expense export filters are not valid.");
    return;
  }

  const adminUser = getAuthenticatedAdmin(response);
  try {
    const file = await exportExpenseRecords({
      q: typeof parsedQuery.data.q === "string" ? parsedQuery.data.q : undefined,
      from: typeof parsedQuery.data.from === "string" ? parsedQuery.data.from : undefined,
      to: typeof parsedQuery.data.to === "string" ? parsedQuery.data.to : undefined,
      page: typeof parsedQuery.data.page === "number" ? String(parsedQuery.data.page) : undefined,
    }, (parsedQuery.data.format === "csv" ? "csv" : parsedQuery.data.format === "pdf" ? "pdf" : "xlsx"), {
      preparedBy: adminUser ? { name: adminUser.name, email: adminUser.email } : null,
    });
    response.setHeader("Content-Type", file.contentType);
    response.setHeader("Content-Disposition", `attachment; filename=\"${file.filename}\"`);
    response.send(file.buffer);
  } catch (error) {
    if (error instanceof PdfServiceError) {
      sendApiError(response, {
        status: error.status,
        category: "system",
        code: "pdf_generation_failed",
        message: error.message,
      });
      return;
    }

    throw error;
  }
}
