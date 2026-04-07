"use client";

import { AdminDrawer } from "@/features/admin/components/admin-drawer";
import {
  AdminFinanceEntryDetailContent,
} from "@/features/admin/components/admin-finance-detail-sections";
import { AdminPaymentMethodPill } from "@/features/admin/components/admin-payment-method-pill";
import {
  formatFinanceDate,
} from "@/features/admin/lib/shared/admin-finance";
import type { AdminIncomeListItem } from "@/features/admin/lib/shared/admin-finance-types";

type AdminIncomeDetailDrawerProps = {
  income: AdminIncomeListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdminIncomeDetailDrawer({
  income,
  open,
  onOpenChange,
}: AdminIncomeDetailDrawerProps) {
  return (
    <AdminDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={income ? income.billNumber : "Income details"}
      description={
        income
          ? "Review full transaction details and line item breakdown."
          : "Inspect the selected income record."
      }
    >
      {income ? (
        <AdminFinanceEntryDetailContent
          eyebrow="Income details"
          summaryTitle={income.customerName}
          summaryCaption={
            income.bookingId
              ? "Booking-linked income record with full saved line items."
              : "Manual income record with full saved line items."
          }
          totalLabel="Total income"
          totalAmount={income.amount}
          summaryFields={[
            {
              label: "Booking reference",
              value: income.bookingCode || "Manual entry",
            },
            {
              label: "Bill number",
              value: income.billNumber,
            },
            {
              label: "Transaction date",
              value: formatFinanceDate(income.transactionDate),
            },
            {
              label: "Payment method",
              value: (
                <AdminPaymentMethodPill
                  kind="income"
                  value={income.paymentMethod}
                />
              ),
            },
          ]}
          lineItemsTitle="Line item breakdown"
          lineItemsDescription="Each saved income item is shown in order with its own amount."
          lineItems={income.items}
          notes={income.notes}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </AdminDrawer>
  );
}
