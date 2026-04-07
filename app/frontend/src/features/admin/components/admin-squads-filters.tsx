"use client";

import { AdminSearchFilterBar } from "@/features/admin/components/admin-search-filter-bar";
import { AdminSquadCreateDrawer } from "@/features/admin/components/admin-squad-create-drawer";
import { useAdminFilters } from "@/features/admin/hooks/use-admin-filters";
import { adminSquadFilterDefaults } from "@/features/admin/lib/shared/admin-filter-defaults";

type AdminSquadsFiltersProps = {
  query?: string;
  status?: string;
  canManageSquads?: boolean;
};

const fieldLabelClassName =
  "admin-kicker-label";

const fieldClassName =
  "h-8 w-full rounded-[1rem] border border-border bg-background px-2.5 text-[11px] leading-4 outline-none transition focus:border-primary";

export function AdminSquadsFilters({
  query = "",
  status = "",
  canManageSquads = false,
}: AdminSquadsFiltersProps) {
  const { values, setValue, reset, hasActiveFilters } = useAdminFilters({
    initialValues: {
      q: query,
      status,
    },
    defaultValues: adminSquadFilterDefaults,
  });

  return (
    <AdminSearchFilterBar
      searchValue={values.q}
      searchPlaceholder="Search squad name, alias, phone, email..."
      onSearchChange={(value) => setValue("q", value)}
      hasActiveFilters={hasActiveFilters}
      hasActiveMoreFilters={Boolean(values.status)}
      onReset={reset}
      actions={canManageSquads ? <AdminSquadCreateDrawer /> : null}
    >
      <div className="grid gap-2 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className={fieldLabelClassName}>Squad status</span>
          <select
            value={values.status}
            onChange={(event) => setValue("status", event.target.value)}
            className={fieldClassName}
          >
            <option value="">All squads</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>
    </AdminSearchFilterBar>
  );
}
