"use client";

import { AdminSearchFilterBar } from "@/features/admin/components/admin-search-filter-bar";
import { useAdminFilters } from "@/features/admin/hooks/use-admin-filters";
import { adminCalendarFilterDefaults } from "@/features/admin/lib/shared/admin-filter-defaults";
import { formatAdminStatusLabel } from "@/features/admin/lib/shared/admin-filter-utils";

type AdminCalendarFiltersProps = {
  q?: string;
  status?: string;
  assignedSquadId?: string;
  serviceTypeId?: string;
  statusOptions: string[];
  squads: Array<{
    id: string;
    name: string;
    alias: string;
  }>;
  serviceTypes: Array<{
    id: string;
    name: string;
  }>;
};

const fieldLabelClassName =
  "admin-kicker-label";

const fieldClassName =
  "h-8 w-full rounded-[1rem] border border-border bg-background px-2.5 text-[11px] leading-4 outline-none transition focus:border-primary";

export function AdminCalendarFilters({
  q = "",
  status = "",
  assignedSquadId = "",
  serviceTypeId = "",
  statusOptions,
  squads,
  serviceTypes,
}: AdminCalendarFiltersProps) {
  const { values, setValue, reset, hasActiveFilters } = useAdminFilters({
    initialValues: {
      q,
      status,
      assignedSquadId,
      serviceTypeId,
    },
    defaultValues: adminCalendarFilterDefaults,
  });

  return (
    <AdminSearchFilterBar
      searchValue={values.q}
      searchPlaceholder="Search schedule, squad, customer..."
      onSearchChange={(value) => setValue("q", value)}
      hasActiveFilters={hasActiveFilters}
      hasActiveMoreFilters={Boolean(
        values.status || values.assignedSquadId || values.serviceTypeId,
      )}
      onReset={reset}
    >
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        <label className="grid gap-1.5">
          <span className={fieldLabelClassName}>Status</span>
          <select
            value={values.status}
            onChange={(event) => setValue("status", event.target.value)}
            className={fieldClassName}
          >
            <option value="">All statuses</option>
            {statusOptions.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {formatAdminStatusLabel(statusOption)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className={fieldLabelClassName}>Assigned squad</span>
          <select
            value={values.assignedSquadId}
            onChange={(event) => setValue("assignedSquadId", event.target.value)}
            className={fieldClassName}
          >
            <option value="">All squads</option>
            {squads.map((squad) => (
              <option key={squad.id} value={squad.id}>
                {squad.alias} · {squad.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className={fieldLabelClassName}>Service type</span>
          <select
            value={values.serviceTypeId}
            onChange={(event) => setValue("serviceTypeId", event.target.value)}
            className={fieldClassName}
          >
            <option value="">All services</option>
            {serviceTypes.map((serviceType) => (
              <option key={serviceType.id} value={serviceType.id}>
                {serviceType.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </AdminSearchFilterBar>
  );
}
