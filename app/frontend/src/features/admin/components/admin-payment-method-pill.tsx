import {
  getExpensePaymentMethodLabel,
  getFinancePaymentMethodLabel,
  getPaymentMethodBadgeClassName,
} from "@/features/admin/lib/shared/admin-finance";
import type { ExpensePaymentMethod, FinancePaymentMethod } from "@/features/admin/lib/shared/admin-finance-types";
import { cn } from "@/lib/utils";

type AdminPaymentMethodPillProps =
  | {
      kind: "income";
      value: FinancePaymentMethod;
      className?: string;
    }
  | {
      kind: "expense";
      value: ExpensePaymentMethod;
      className?: string;
    };

export function AdminPaymentMethodPill(props: AdminPaymentMethodPillProps) {
  const label =
    props.kind === "income"
      ? getFinancePaymentMethodLabel(props.value)
      : getExpensePaymentMethodLabel(props.value);

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[9px] font-medium whitespace-nowrap",
        getPaymentMethodBadgeClassName(label),
        props.className,
      )}
    >
      {label}
    </span>
  );
}
