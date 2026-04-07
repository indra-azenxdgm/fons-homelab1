"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteIncomeBrowser } from "@/features/admin/api/finance-browser-api";
import { AdminIncomeDetailDrawer } from "@/features/admin/components/admin-income-detail-drawer";
import { AdminIncomeDrawer } from "@/features/admin/components/admin-income-drawer";
import { AdminPaymentMethodPill } from "@/features/admin/components/admin-payment-method-pill";
import {
  adminTableActionsCellClassName,
  adminTableActionsHeaderClassName,
  adminTableDeleteIconButtonClassName,
} from "@/features/admin/components/admin-table-actions";
import { formatFinanceDate, formatRupiah } from "@/features/admin/lib/shared/admin-finance";
import type { AdminFinanceBookingLookupItem, AdminIncomeListItem } from "@/features/admin/lib/shared/admin-finance-types";

type AdminIncomeListProps = {
  items: AdminIncomeListItem[];
  page: number;
  totalPages: number;
  q?: string;
  from?: string;
  to?: string;
  paymentMethod?: string;
  bookingLink?: string;
  bookingOptions: AdminFinanceBookingLookupItem[];
  canManageFinance?: boolean;
};

function buildIncomePageHref(input: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  Object.entries(input).forEach(([key, value]) => {
    if (value && String(value).trim()) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `/admin/finance/income?${query}` : "/admin/finance/income";
}

function getIncomeDisplayValue(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

export function AdminIncomeList({
  items,
  page,
  totalPages,
  q,
  from,
  to,
  paymentMethod,
  bookingLink,
  bookingOptions,
  canManageFinance = false,
}: AdminIncomeListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedIncome, setSelectedIncome] = useState<AdminIncomeListItem | null>(null);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this income record?")) {
      return;
    }

    startTransition(async () => {
      await deleteIncomeBrowser(id);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <section className="rounded-[1.6rem] border border-dashed border-border/80 bg-white/80 p-8 text-center">
        <p className="admin-empty-title">No income records yet</p>
        <p className="admin-empty-copy mt-2">Create the first income record or adjust the current filters.</p>
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
            onClick={() => setSelectedIncome(item)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedIncome(item);
              }
            }}
            className="cursor-pointer rounded-[1.1rem] border border-border/70 bg-white/94 px-3.5 py-3 shadow-[0_12px_24px_-26px_rgba(15,23,42,0.18)] transition hover:border-border hover:bg-muted/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold leading-5 text-foreground">{getIncomeDisplayValue(item.customerName, "Unknown customer")}</p>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{getIncomeDisplayValue(item.billNumber, "-")}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <AdminPaymentMethodPill kind="income" value={item.paymentMethod} />
                  {item.bookingCode ? <span className="inline-flex rounded-full border border-border/80 bg-muted/35 px-2 py-0.5 text-[9px] font-medium text-foreground">{item.bookingCode}</span> : null}
                </div>
              </div>
              <p className="text-[11px] font-semibold text-foreground">{formatRupiah(item.amount)}</p>
            </div>

            <p className="mt-2 text-[11px] leading-4 text-foreground/82">{getIncomeDisplayValue(item.serviceDescription, "Manual income entry")}</p>

            <div className="mt-2.5 flex items-center justify-between gap-3">
              <span className="text-[10px] text-muted-foreground">{index + 1 + (page - 1) * 12}. {formatFinanceDate(item.transactionDate)}</span>
              <div
                className="flex items-center gap-2"
                onClick={(event) => event.stopPropagation()}
              >
                {canManageFinance ? (
                  <>
                    <AdminIncomeDrawer income={item} bookingOptions={bookingOptions} iconOnly />
                    <button type="button" disabled={isPending} onClick={() => void handleDelete(item.id)} className={adminTableDeleteIconButtonClassName} aria-label="Delete income" title="Delete income">
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Delete income</span>
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
                <th className="px-3 py-2 font-medium">Customer Name / Booking</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Bill Number</th>
                <th className="px-3 py-2 font-medium">Price</th>
                <th className="px-3 py-2 font-medium">Service Description</th>
                <th className="px-3 py-2 font-medium">Payment Method</th>
                <th className={adminTableActionsHeaderClassName}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedIncome(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedIncome(item);
                    }
                  }}
                  className="cursor-pointer border-t border-border/70 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <td className="px-3 py-2">{index + 1 + (page - 1) * 12}</td>
                  <td className="px-3 py-2">
                    <div className="font-semibold">{getIncomeDisplayValue(item.customerName, "Unknown customer")}</div>
                    <div className="text-[10px] text-muted-foreground">{item.bookingCode || "Manual entry"}</div>
                  </td>
                  <td className="px-3 py-2">{formatFinanceDate(item.transactionDate)}</td>
                  <td className="px-3 py-2">{getIncomeDisplayValue(item.billNumber, "-")}</td>
                  <td className="px-3 py-2 font-medium">{formatRupiah(item.amount)}</td>
                  <td className="max-w-[18rem] px-3 py-2"><span className="block truncate">{getIncomeDisplayValue(item.serviceDescription, "Manual income entry")}</span></td>
                  <td className="px-3 py-2">
                    <AdminPaymentMethodPill kind="income" value={item.paymentMethod} />
                  </td>
                  <td className={adminTableActionsCellClassName}>
                    <div
                      className="flex items-center justify-center gap-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {canManageFinance ? (
                        <>
                          <AdminIncomeDrawer income={item} bookingOptions={bookingOptions} iconOnly />
                          <button type="button" disabled={isPending} onClick={() => void handleDelete(item.id)} className={adminTableDeleteIconButtonClassName} aria-label="Delete income" title="Delete income">
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Delete income</span>
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
          <Link href={buildIncomePageHref({ page: Math.max(1, page - 1), q, from, to, paymentMethod, bookingLink })} aria-disabled={page <= 1} className={`admin-pagination-button ${page <= 1 ? "pointer-events-none border-border/60 text-muted-foreground/50" : "border-border bg-background text-foreground hover:bg-muted"}`}>
            Previous
          </Link>
          <p className="admin-pagination-text text-center">Page {page} of {totalPages}</p>
          <Link href={buildIncomePageHref({ page: Math.min(totalPages, page + 1), q, from, to, paymentMethod, bookingLink })} aria-disabled={page >= totalPages} className={`admin-pagination-button ${page >= totalPages ? "pointer-events-none border-border/60 text-muted-foreground/50" : "border-border bg-background text-foreground hover:bg-muted"}`}>
            Next
          </Link>
        </nav>
      ) : null}

      <AdminIncomeDetailDrawer
        income={selectedIncome}
        open={Boolean(selectedIncome)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedIncome(null);
          }
        }}
      />
    </>
  );
}
