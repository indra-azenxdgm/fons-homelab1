"use client";

import { AdminDateFilterField } from "@/features/admin/components/admin-date-filter-field";
import { AdminExpenseDrawer } from "@/features/admin/components/admin-expense-drawer";
import { AdminFinanceExportMenu } from "@/features/admin/components/admin-finance-export-menu";
import { AdminSearchFilterBar } from "@/features/admin/components/admin-search-filter-bar";
import { useAdminFilters } from "@/features/admin/hooks/use-admin-filters";
import { adminFinanceExpenseFilterDefaults } from "@/features/admin/lib/shared/admin-filter-defaults";

const fieldLabelClassName = "admin-kicker-label";

type AdminExpenseFiltersProps = {
  query?: string;
  from?: string;
  to?: string;
  canManageFinance?: boolean;
};

export function AdminExpenseFilters({ query = "", from = "", to = "", canManageFinance = false }: AdminExpenseFiltersProps) {
  const { values, setValue, reset, hasActiveFilters } = useAdminFilters({
    initialValues: {
      q: query,
      from,
      to,
    },
    defaultValues: adminFinanceExpenseFilterDefaults,
  });

  return (
    <AdminSearchFilterBar
      searchValue={values.q}
      searchPlaceholder="Search bill code, expense name, or notes..."
      onSearchChange={(value) => setValue("q", value)}
      hasActiveFilters={hasActiveFilters}
      hasActiveMoreFilters={Boolean(values.from || values.to)}
      onReset={reset}
      actions={
        <>
          <AdminFinanceExportMenu exportPath="/api/admin/finance/expenses/export" />
          {canManageFinance ? <AdminExpenseDrawer /> : null}
        </>
      }
    >
      <div className="grid gap-2 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className={fieldLabelClassName}>Date from</span>
          <AdminDateFilterField value={values.from} onChange={(event) => setValue("from", event.target.value)} />
        </label>

        <label className="grid gap-1.5">
          <span className={fieldLabelClassName}>Date to</span>
          <AdminDateFilterField value={values.to} onChange={(event) => setValue("to", event.target.value)} />
        </label>
      </div>
    </AdminSearchFilterBar>
  );
}
