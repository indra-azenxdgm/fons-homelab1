"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/features/admin/lib/shared/admin-finance";
import { cn } from "@/lib/utils";

type AdminFinanceDetailLineItem = {
  id: string;
  description: string;
  amount: number;
  sortOrder: number;
};

type AdminFinanceSummaryField = {
  label: string;
  value: ReactNode;
};

type AdminFinanceEntryDetailContentProps = {
  eyebrow: string;
  summaryTitle: string;
  summaryCaption: string;
  totalLabel: string;
  totalAmount: number;
  summaryFields: AdminFinanceSummaryField[];
  lineItemsTitle: string;
  lineItemsDescription: string;
  lineItems: AdminFinanceDetailLineItem[];
  notes?: string | null;
  onClose: () => void;
};

function DetailFieldCard({
  label,
  value,
}: AdminFinanceSummaryField) {
  return (
    <div className="rounded-[1rem] border border-border/70 bg-white/80 px-3 py-3 shadow-[0_12px_24px_-28px_rgba(15,23,42,0.16)]">
      <p className="admin-kicker-label">{label}</p>
      <div className="mt-1 text-[11px] font-medium leading-5 text-foreground">
        {value}
      </div>
    </div>
  );
}

export function AdminFinanceEntryDetailContent({
  eyebrow,
  summaryTitle,
  summaryCaption,
  totalLabel,
  totalAmount,
  summaryFields,
  lineItemsTitle,
  lineItemsDescription,
  lineItems,
  notes,
  onClose,
}: AdminFinanceEntryDetailContentProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-[1.2rem] border border-[#D8E7F5] bg-[linear-gradient(135deg,rgba(247,251,255,0.96),rgba(255,255,255,0.96))] p-4 shadow-[0_20px_40px_-34px_rgba(0,81,162,0.2)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="admin-kicker-label">{eyebrow}</p>
            <h2 className="mt-1 text-[1rem] font-semibold leading-5 tracking-[-0.02em] text-foreground">
              {summaryTitle}
            </h2>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {summaryCaption}
            </p>
          </div>

          <div className="rounded-[1rem] border border-primary/14 bg-white/92 px-3.5 py-3 shadow-[0_12px_26px_-30px_rgba(0,81,162,0.22)] sm:min-w-[10.5rem] sm:text-right">
            <p className="admin-kicker-label">{totalLabel}</p>
            <p className="mt-1 text-[1.15rem] font-semibold leading-6 tracking-[-0.03em] text-foreground">
              {formatRupiah(totalAmount)}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {summaryFields.map((field) => (
            <DetailFieldCard
              key={field.label}
              label={field.label}
              value={field.value}
            />
          ))}
        </div>
      </section>

      <section className="rounded-[1.15rem] border border-border/70 bg-white/94 p-3.5 shadow-[0_18px_34px_-34px_rgba(15,23,42,0.16)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="admin-kicker-label">{lineItemsTitle}</p>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {lineItemsDescription}
            </p>
          </div>
          <span className="inline-flex rounded-full border border-border/80 bg-muted/30 px-2.5 py-1 text-[10px] font-medium text-foreground/82">
            {lineItems.length} item{lineItems.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-3 space-y-2.5">
          {lineItems.map((item, index) => (
            <article
              key={item.id}
              className="rounded-[1rem] border border-border/70 bg-muted/[0.18] px-3.5 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="inline-flex rounded-full border border-border/80 bg-white px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Item {index + 1}
                  </span>
                  <p className="mt-2 text-[11px] leading-5 text-foreground">
                    {item.description}
                  </p>
                </div>
                <p className="shrink-0 text-[12px] font-semibold leading-5 text-foreground">
                  {formatRupiah(item.amount)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {notes ? (
        <section className="rounded-[1.15rem] border border-border/70 bg-white/94 p-3.5 shadow-[0_18px_34px_-34px_rgba(15,23,42,0.16)]">
          <p className="admin-kicker-label">Notes</p>
          <p className="mt-2 whitespace-pre-wrap text-[11px] leading-5 text-foreground/88">
            {notes}
          </p>
        </section>
      ) : null}

      <div className="flex justify-end border-t border-border/70 pt-3">
        <Button
          type="button"
          variant="outline"
          className={cn("h-8 rounded-full px-3 text-[10px] font-medium")}
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}
