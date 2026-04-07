export const financePaymentMethodOptions = [
  "CASH",
  "TRANSFER_BCA",
  "TRANSFER_BRI",
  "TRANSFER_BNI",
  "TRANSFER_MANDIRI",
  "OTHER",
] as const;

export type FinancePaymentMethod = (typeof financePaymentMethodOptions)[number];

export const expenseCategoryOptions = [
  "OPERATIONAL",
  "SPARE_PART",
  "MAINTENANCE",
  "OFFICE",
  "SUBSCRIPTION",
  "TRANSPORTATION",
  "TOOLS",
  "OTHER",
] as const;

export type ExpenseCategory = (typeof expenseCategoryOptions)[number];

export const expensePaymentMethodOptions = [
  "CASH",
  "BANK_TRANSFER",
  "QRIS",
  "OTHER",
] as const;

export type ExpensePaymentMethod = (typeof expensePaymentMethodOptions)[number];

export type AdminFinanceBookingLookupItem = {
  id: string;
  bookingCode: string;
  contactName: string;
  bookingDate: Date | string;
  serviceType: {
    name: string;
  };
};

export type AdminIncomeListItem = {
  items: Array<{
    id: string;
    description: string;
    amount: number;
    sortOrder: number;
  }>;
  id: string;
  incomeCode: string;
  bookingId: string | null;
  bookingCode: string | null;
  customerName: string;
  transactionDate: Date | string;
  billNumber: string;
  amount: number;
  serviceDescription: string;
  paymentMethod: FinancePaymentMethod;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type AdminExpenseListItem = {
  items: Array<{
    id: string;
    description: string;
    amount: number;
    sortOrder: number;
  }>;
  id: string;
  transactionDate: Date | string;
  billCode: string;
  expenseType: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};
