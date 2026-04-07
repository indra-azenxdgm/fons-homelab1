"use client";

import { AdminSearchFilterBar } from "@/features/admin/components/admin-search-filter-bar";
import { useAdminFilters } from "@/features/admin/hooks/use-admin-filters";
import { adminCustomerFilterDefaults } from "@/features/admin/lib/shared/admin-filter-defaults";

type AdminCustomersFiltersProps = {
  query?: string;
  activity?: string;
};

const fieldLabelClassName =
  "admin-kicker-label";

const fieldClassName =
  "h-8 w-full rounded-[1rem] border border-border bg-background px-2.5 text-[11px] leading-4 outline-none transition focus:border-primary";

export function AdminCustomersFilters({
  query = "",
  activity = "",
}: AdminCustomersFiltersProps) {
  const { values, setValue, reset, hasActiveFilters } = useAdminFilters({
    initialValues: {
      q: query,
      activity,
    },
    defaultValues: adminCustomerFilterDefaults,
  });

  return (
    <AdminSearchFilterBar
      searchValue={values.q}
      searchPlaceholder="Search customer name, phone, email..."
      onSearchChange={(value) => setValue("q", value)}
      hasActiveFilters={hasActiveFilters}
      hasActiveMoreFilters={Boolean(values.activity)}
      onReset={reset}
    >
      <div className="grid gap-2 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className={fieldLabelClassName}>Booking activity</span>
          <select
            value={values.activity}
            onChange={(event) => setValue("activity", event.target.value)}
            className={fieldClassName}
          >
            <option value="">All customers</option>
            <option value="with_bookings">With bookings</option>
            <option value="without_bookings">Without bookings</option>
          </select>
        </label>
      </div>
    </AdminSearchFilterBar>
  );
}
