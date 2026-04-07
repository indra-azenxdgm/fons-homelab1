"use client";

import { AdminDateFilterField } from "@/features/admin/components/admin-date-filter-field";
import { AdminFinanceExportMenu } from "@/features/admin/components/admin-finance-export-menu";
import { AdminIncomeDrawer } from "@/features/admin/components/admin-income-drawer";
import { AdminSearchFilterBar } from "@/features/admin/components/admin-search-filter-bar";
import { useAdminFilters } from "@/features/admin/hooks/use-admin-filters";
import { adminFinanceIncomeFilterDefaults } from "@/features/admin/lib/shared/admin-filter-defaults";
import { getFinancePaymentMethodLabel } from "@/features/admin/lib/shared/admin-finance";
import { financePaymentMethodOptions, type AdminFinanceBookingLookupItem, type FinancePaymentMethod } from "@/features/admin/lib/shared/admin-finance-types";

const fieldLabelClassName = "admin-kicker-label";
const fieldClassName = "h-8 w-full rounded-[1rem] border border-border bg-background px-2.5 text-[11px] leading-4 outline-none transition focus:border-primary";

type AdminIncomeFiltersProps = {
  query?: string;
  from?: string;
  to?: string;
  paymentMethod?: string;
  bookingLink?: string;
  bookingOptions: AdminFinanceBookingLookupItem[];
  canManageFinance?: boolean;
};

export function AdminIncomeFilters({
  query = "",
  from = "",
  to = "",
  paymentMethod = "",
  bookingLink = "",
  bookingOptions,
  canManageFinance = false,
}: AdminIncomeFiltersProps) {
  const { values, setValue, reset, hasActiveFilters } = useAdminFilters({
    initialValues: {
      q: query,
      from,
      to,
      paymentMethod,
      bookingLink,
    },
    defaultValues: adminFinanceIncomeFilterDefaults,
  });

  return (
    <AdminSearchFilterBar
      searchValue={values.q}
      searchPlaceholder="Search customer, bill number, booking id, service..."
      onSearchChange={(value) => setValue("q", value)}
      hasActiveFilters={hasActiveFilters}
      hasActiveMoreFilters={Boolean(values.from || values.to || values.paymentMethod || values.bookingLink)}
      onReset={reset}
      actions={
        <>
          <AdminFinanceExportMenu exportPath="/api/admin/finance/income/export" />
          {canManageFinance ? <AdminIncomeDrawer bookingOptions={bookingOptions} /> : null}
        </>
      }
    >
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-1.5">
          <span className={fieldLabelClassName}>Date from</span>
          <AdminDateFilterField value={values.from} onChange={(event) => setValue("from", event.target.value)} />
        </label>

        <label className="grid gap-1.5">
          <span className={fieldLabelClassName}>Date to</span>
          <AdminDateFilterField value={values.to} onChange={(event) => setValue("to", event.target.value)} />
        </label>

        <label className="grid gap-1.5">
          <span className={fieldLabelClassName}>Payment method</span>
          <select value={values.paymentMethod} onChange={(event) => setValue("paymentMethod", event.target.value)} className={fieldClassName}>
            <option value="">All methods</option>
            {financePaymentMethodOptions.map((item) => (
              <option key={item} value={item}>
                {getFinancePaymentMethodLabel(item as FinancePaymentMethod)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className={fieldLabelClassName}>Source</span>
          <select value={values.bookingLink} onChange={(event) => setValue("bookingLink", event.target.value)} className={fieldClassName}>
            <option value="">All income</option>
            <option value="linked">Booking linked</option>
            <option value="manual">Manual entry</option>
          </select>
        </label>
      </div>
    </AdminSearchFilterBar>
  );
}
