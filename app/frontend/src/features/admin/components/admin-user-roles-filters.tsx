"use client";

import { AdminSearchFilterBar } from "@/features/admin/components/admin-search-filter-bar";
import { AdminUserCreateDrawer } from "@/features/admin/components/admin-user-create-drawer";
import { useAdminFilters } from "@/features/admin/hooks/use-admin-filters";
import { adminUserRoleFilterDefaults } from "@/features/admin/lib/shared/admin-filter-defaults";

const fieldLabelClassName =
  "admin-kicker-label";

const fieldClassName =
  "h-8 w-full rounded-[1rem] border border-border bg-background px-2.5 text-[11px] leading-4 outline-none transition focus:border-primary";

type AdminUserRolesFiltersProps = {
  query?: string;
  role?: string;
  status?: string;
};

export function AdminUserRolesFilters({
  query = "",
  role = "",
  status = "",
}: AdminUserRolesFiltersProps) {
  const { values, setValue, reset, hasActiveFilters } = useAdminFilters({
    initialValues: {
      q: query,
      role,
      status,
    },
    defaultValues: adminUserRoleFilterDefaults,
  });

  return (
    <AdminSearchFilterBar
      searchValue={values.q}
      searchPlaceholder="Search user name or email..."
      onSearchChange={(value) => setValue("q", value)}
      hasActiveFilters={hasActiveFilters}
      hasActiveMoreFilters={Boolean(values.role || values.status)}
      onReset={reset}
      actions={<AdminUserCreateDrawer />}
    >
      <div className="grid gap-2 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className={fieldLabelClassName}>Role</span>
          <select
            value={values.role}
            onChange={(event) => setValue("role", event.target.value)}
            className={fieldClassName}
          >
            <option value="">All roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="SQUAD">Squad</option>
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className={fieldLabelClassName}>Status</span>
          <select
            value={values.status}
            onChange={(event) => setValue("status", event.target.value)}
            className={fieldClassName}
          >
            <option value="">All users</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>
    </AdminSearchFilterBar>
  );
}
