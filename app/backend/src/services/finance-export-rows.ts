type IncomeExportRecord = {
  customerName: string;
  bookingCode: string | null;
  transactionDate: Date | string;
  billNumber: string;
  paymentMethod: string;
  items: Array<{
    id: string;
    description: string;
    amount: number;
  }>;
};

type ExpenseExportRecord = {
  transactionDate: Date | string;
  billCode: string;
  expenseType: string;
  category: string;
  paymentMethod: string;
  notes: string | null;
  items: Array<{
    id: string;
    description: string;
    amount: number;
  }>;
};

export type FlattenedIncomeExportRow = {
  customerName: string;
  bookingReference: string;
  transactionDate: Date | string;
  billNumber: string;
  price: number;
  serviceDescription: string;
  paymentMethod: string;
};

export type FlattenedExpenseExportRow = {
  transactionDate: Date | string;
  billCode: string;
  expenseItem: string;
  category: string;
  amount: number;
  paymentMethod: string;
  notes: string;
};

export function flattenIncomeExportRows(
  records: IncomeExportRecord[],
): FlattenedIncomeExportRow[] {
  return records.flatMap((record) =>
    record.items.map((item) => ({
      customerName: record.customerName,
      bookingReference: record.bookingCode || "-",
      transactionDate: record.transactionDate,
      billNumber: record.billNumber,
      price: item.amount,
      serviceDescription: item.description,
      paymentMethod: record.paymentMethod,
    })),
  );
}

export function flattenExpenseExportRows(
  records: ExpenseExportRecord[],
): FlattenedExpenseExportRow[] {
  return records.flatMap((record) =>
    record.items.map((item) => ({
      transactionDate: record.transactionDate,
      billCode: record.billCode,
      expenseItem: item.description,
      category: record.category,
      amount: item.amount,
      paymentMethod: record.paymentMethod,
      notes: record.notes || "",
    })),
  );
}
