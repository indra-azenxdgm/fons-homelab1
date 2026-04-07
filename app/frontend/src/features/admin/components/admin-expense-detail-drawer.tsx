"use client";

import { AdminDrawer } from "@/features/admin/components/admin-drawer";
import {
  AdminFinanceEntryDetailContent,
} from "@/features/admin/components/admin-finance-detail-sections";
import { AdminPaymentMethodPill } from "@/features/admin/components/admin-payment-method-pill";
import {
  formatFinanceDate,
  getExpenseCategoryLabel,
} from "@/features/admin/lib/shared/admin-finance";
import type { AdminExpenseListItem } from "@/features/admin/lib/shared/admin-finance-types";

type AdminExpenseDetailDrawerProps = {
  expense: AdminExpenseListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminExpenseDetailDrawer({
  expense,
  open,
  onOpenChange,
}: AdminExpenseDetailDrawerProps) {
  return (
    <AdminDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={expense ? expense.billCode : "Expense details"}
      description={
        expense
          ? "Review full transaction details and line item breakdown."
          : "Inspect the selected expense record."
      }
    >
      {expense ? (
        <AdminFinanceEntryDetailContent
          eyebrow="Expense details"
          summaryTitle={expense.expenseType}
          summaryCaption="Review the saved expense breakdown without entering edit mode."
          totalLabel="Total expense"
          totalAmount={expense.amount}
          summaryFields={[
            {
              label: "Bill code",
              value: expense.billCode,
            },
            {
              label: "Transaction date",
              value: formatFinanceDate(expense.transactionDate),
            },
            {
              label: "Category",
              value: getExpenseCategoryLabel(expense.category),
            },
            {
              label: "Payment method",
              value: (
                <AdminPaymentMethodPill
                  kind="expense"
                  value={expense.paymentMethod}
                />
              ),
            },
          ]}
          lineItemsTitle="Line item breakdown"
          lineItemsDescription="Each saved expense item is shown in order with its own amount."
          lineItems={expense.items}
          notes={expense.notes}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </AdminDrawer>
  );
}
