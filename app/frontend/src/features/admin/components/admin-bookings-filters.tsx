"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { AdminDateFilterField } from "@/features/admin/components/admin-date-filter-field";
import { AdminSearchFilterBar } from "@/features/admin/components/admin-search-filter-bar";
import { useAdminFilters } from "@/features/admin/hooks/use-admin-filters";
import { adminBookingFilterDefaults } from "@/features/admin/lib/shared/admin-filter-defaults";
import { formatAdminStatusLabel } from "@/features/admin/lib/shared/admin-filter-utils";
import { cn } from "@/lib/utils";

type AdminBookingsFiltersProps = {
  q?: string;
  date?: string;
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

export function AdminBookingsFilters({
  q = "",
  date = "",
  status = "",
  assignedSquadId = "",
  serviceTypeId = "",
  statusOptions,
  squads,
  serviceTypes,
}: AdminBookingsFiltersProps) {
  const { values, setValue, reset, hasActiveFilters } = useAdminFilters({
    initialValues: {
      q,
      date,
      status,
      assignedSquadId,
      serviceTypeId,
    },
    defaultValues: adminBookingFilterDefaults,
  });

  const hasActiveMoreFilters = Boolean(
      values.date ||
      values.status ||
      values.assignedSquadId ||
      values.serviceTypeId,
  );

  return (
    <AdminSearchFilterBar
      searchValue={values.q}
      searchPlaceholder="Search booking code, customer, phone, squad..."
      onSearchChange={(value) => setValue("q", value)}
      hasActiveFilters={hasActiveFilters}
      hasActiveMoreFilters={hasActiveMoreFilters}
      onReset={reset}
      actions={
        <Link
          href="/booking"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "size-8 rounded-[0.95rem]",
          )}
          aria-label="Open public booking page"
          title="Open public booking page"
        >
          <Plus className="size-3.5" />
        </Link>
      }
    >
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-1.5">
          <span className={fieldLabelClassName}>Booking date</span>
          <AdminDateFilterField
            value={values.date}
            onChange={(event) => setValue("date", event.target.value)}
          />
        </label>

        <label className="grid gap-1.5">
          <span className={fieldLabelClassName}>Status</span>
          <select
            value={values.status}
            onChange={(event) => setValue("status", event.target.value)}
            className={fieldClassName}
          >
            <option value="">All statuses</option>
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {formatAdminStatusLabel(item)}
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
