"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteExpenseBrowser } from "@/features/admin/api/finance-browser-api";
import { AdminExpenseDetailDrawer } from "@/features/admin/components/admin-expense-detail-drawer";
import { AdminExpenseDrawer } from "@/features/admin/components/admin-expense-drawer";
import { AdminPaymentMethodPill } from "@/features/admin/components/admin-payment-method-pill";
import {
  adminTableActionsCellClassName,
  adminTableActionsHeaderClassName,
  adminTableDeleteIconButtonClassName,
} from "@/features/admin/components/admin-table-actions";
import { formatFinanceDate, formatRupiah, getExpenseCategoryLabel } from "@/features/admin/lib/shared/admin-finance";
import type { AdminExpenseListItem } from "@/features/admin/lib/shared/admin-finance-types";

type AdminExpensesListProps = {
  items: AdminExpenseListItem[];
  page: number;
  totalPages: number;
  q?: string;
  from?: string;
  to?: string;
  canManageFinance?: boolean;
};

function buildExpensesPageHref(input: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  Object.entries(input).forEach(([key, value]) => {
    if (value && String(value).trim()) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `/admin/finance/expenses?${query}` : "/admin/finance/expenses";
}

function getExpenseDisplayValue(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

export function AdminExpensesList({ items, page, totalPages, q, from, to, canManageFinance = false }: AdminExpensesListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedExpense, setSelectedExpense] = useState<AdminExpenseListItem | null>(null);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this expense record?")) {
      return;
    }

    startTransition(async () => {
      await deleteExpenseBrowser(id);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <section className="rounded-[1.6rem] border border-dashed border-border/80 bg-white/80 p-8 text-center">
        <p className="admin-empty-title">No expense records yet</p>
        <p className="admin-empty-copy mt-2">Create the first expense record or adjust the current filters.</p>
      </section>
    );
  }

  return (
    <>
      <section className="grid gap-2.5 lg:hidden">
        {items.map((item, index) => (
          <article
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedExpense(item)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedExpense(item);
              }
            }}
            className="cursor-pointer rounded-[1.1rem] border border-border/70 bg-white/94 px-3.5 py-3 shadow-[0_12px_24px_-26px_rgba(15,23,42,0.18)] transition hover:border-border hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold leading-5 text-foreground">{getExpenseDisplayValue(item.expenseType, "Unnamed expense")}</p>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{getExpenseDisplayValue(item.billCode, "-")}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-border/80 bg-muted/35 px-2 py-0.5 text-[9px] font-medium text-foreground">{getExpenseCategoryLabel(item.category)}</span>
                  <AdminPaymentMethodPill kind="expense" value={item.paymentMethod} />
                </div>
              </div>
              <p className="text-[11px] font-semibold text-foreground">{formatRupiah(item.amount)}</p>
            </div>

            <p className="mt-2 text-[11px] leading-4 text-foreground/82">{item.notes || "No notes"}</p>

            <div className="mt-2.5 flex items-center justify-between gap-3">
              <span className="text-[10px] text-muted-foreground">{index + 1 + (page - 1) * 12}. {formatFinanceDate(item.transactionDate)}</span>
              <div
                className="flex items-center gap-2"
                onClick={(event) => event.stopPropagation()}
              >
                {canManageFinance ? (
                  <>
                    <AdminExpenseDrawer expense={item} iconOnly />
                    <button type="button" disabled={isPending} onClick={() => void handleDelete(item.id)} className={adminTableDeleteIconButtonClassName} aria-label="Delete expense" title="Delete expense">
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Delete expense</span>
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="hidden overflow-hidden rounded-[1.6rem] border border-border/70 bg-white/94 shadow-[0_20px_44px_-36px_rgba(15,23,42,0.2)] lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-[11px] leading-4">
            <thead className="bg-muted/45 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">No</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Bill Code</th>
                <th className="px-3 py-2 font-medium">Expense Name</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Payment Method</th>
                <th className="px-3 py-2 font-medium">Notes</th>
                <th className={adminTableActionsHeaderClassName}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedExpense(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedExpense(item);
                    }
                  }}
                  className="cursor-pointer border-t border-border/70 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <td className="px-3 py-2">{index + 1 + (page - 1) * 12}</td>
                  <td className="px-3 py-2">{formatFinanceDate(item.transactionDate)}</td>
                  <td className="px-3 py-2">{getExpenseDisplayValue(item.billCode, "-")}</td>
                  <td className="px-3 py-2 font-semibold">{getExpenseDisplayValue(item.expenseType, "Unnamed expense")}</td>
                  <td className="px-3 py-2">{getExpenseCategoryLabel(item.category)}</td>
                  <td className="px-3 py-2 font-medium">{formatRupiah(item.amount)}</td>
                  <td className="px-3 py-2">
                    <AdminPaymentMethodPill kind="expense" value={item.paymentMethod} />
                  </td>
                  <td className="max-w-[18rem] px-3 py-2"><span className="block truncate">{item.notes || "-"}</span></td>
                  <td className={adminTableActionsCellClassName}>
                    <div
                      className="flex items-center justify-center gap-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {canManageFinance ? (
                        <>
                          <AdminExpenseDrawer expense={item} iconOnly />
                          <button type="button" disabled={isPending} onClick={() => void handleDelete(item.id)} className={adminTableDeleteIconButtonClassName} aria-label="Delete expense" title="Delete expense">
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Delete expense</span>
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {totalPages > 1 ? (
        <nav className="flex items-center justify-between rounded-[1.1rem] border border-border/70 bg-white/82 px-3.5 py-3 shadow-[0_12px_28px_-28px_rgba(15,23,42,0.16)] sm:px-4">
          <Link href={buildExpensesPageHref({ page: Math.max(1, page - 1), q, from, to })} aria-disabled={page <= 1} className={`admin-pagination-button ${page <= 1 ? "pointer-events-none border-border/60 text-muted-foreground/50" : "border-border bg-background text-foreground hover:bg-muted"}`}>
            Previous
          </Link>
          <p className="admin-pagination-text text-center">Page {page} of {totalPages}</p>
          <Link href={buildExpensesPageHref({ page: Math.min(totalPages, page + 1), q, from, to })} aria-disabled={page >= totalPages} className={`admin-pagination-button ${page >= totalPages ? "pointer-events-none border-border/60 text-muted-foreground/50" : "border-border bg-background text-foreground hover:bg-muted"}`}>
            Next
          </Link>
        </nav>
      ) : null}

      <AdminExpenseDetailDrawer
        expense={selectedExpense}
        open={Boolean(selectedExpense)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedExpense(null);
          }
        }}
      />
    </>
  );
}
