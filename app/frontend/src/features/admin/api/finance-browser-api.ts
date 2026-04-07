"use client";

import type {
  ExpenseCategory,
  ExpensePaymentMethod,
  AdminExpenseListItem,
  AdminFinanceBookingLookupItem,
  AdminIncomeListItem,
  FinancePaymentMethod,
} from "@/features/admin/lib/shared/admin-finance-types";
import { BackendApiError, fetchBackendJson } from "@/lib/api-client";

function getFrontendOrigin() {
  return window.location.origin;
}

export async function getFinanceBookingLookupBrowser(q: string) {
  const params = new URLSearchParams();

  if (q.trim()) {
    params.set("q", q.trim());
  }

  params.set("limit", "20");

  return fetchBackendJson<{ items: AdminFinanceBookingLookupItem[] }>(`/api/admin/finance/bookings?${params.toString()}`, {
    baseUrl: getFrontendOrigin(),
  });
}

export async function createIncomeBrowser(input: {
  bookingId?: string | null;
  customerName: string;
  transactionDate: string;
  billNumber: string;
  paymentMethod: FinancePaymentMethod;
  notes?: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
}) {
  return fetchBackendJson<{ success: true; record: Pick<AdminIncomeListItem, "id"> }>("/api/admin/finance/income", {
    baseUrl: getFrontendOrigin(),
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateIncomeBrowser(
  incomeId: string,
  input: {
    bookingId?: string | null;
    customerName: string;
    transactionDate: string;
    billNumber: string;
    paymentMethod: FinancePaymentMethod;
    notes?: string;
    items: Array<{
      description: string;
      amount: number;
    }>;
  },
) {
  return fetchBackendJson<{ success: true }>(`/api/admin/finance/income/${incomeId}`, {
    baseUrl: getFrontendOrigin(),
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteIncomeBrowser(incomeId: string) {
  return fetchBackendJson<{ success: true }>(`/api/admin/finance/income/${incomeId}`, {
    baseUrl: getFrontendOrigin(),
    method: "DELETE",
  });
}

export async function createExpenseBrowser(input: {
  transactionDate: string;
  billCode: string;
  category: ExpenseCategory;
  paymentMethod?: ExpensePaymentMethod | null;
  notes?: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
}) {
  return fetchBackendJson<{ success: true; record: Pick<AdminExpenseListItem, "id"> }>("/api/admin/finance/expenses", {
    baseUrl: getFrontendOrigin(),
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateExpenseBrowser(
  expenseId: string,
  input: {
    transactionDate: string;
    billCode: string;
    category: ExpenseCategory;
    paymentMethod?: ExpensePaymentMethod | null;
    notes?: string;
    items: Array<{
      description: string;
      amount: number;
    }>;
  },
) {
  return fetchBackendJson<{ success: true }>(`/api/admin/finance/expenses/${expenseId}`, {
    baseUrl: getFrontendOrigin(),
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteExpenseBrowser(expenseId: string) {
  return fetchBackendJson<{ success: true }>(`/api/admin/finance/expenses/${expenseId}`, {
    baseUrl: getFrontendOrigin(),
    method: "DELETE",
  });
}

export { BackendApiError };
