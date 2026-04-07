"use client";

import { useState, type ReactNode } from "react";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminMoreFilterPanel } from "@/features/admin/components/admin-more-filter-panel";

type AdminSearchFilterBarProps = {
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  hasActiveFilters: boolean;
  hasActiveMoreFilters?: boolean;
  onReset: () => void;
  actions?: ReactNode;
  children?: ReactNode;
};

export function AdminSearchFilterBar({
  searchValue,
  searchPlaceholder,
  onSearchChange,
  hasActiveFilters,
  hasActiveMoreFilters = false,
  onReset,
  actions,
  children,
}: AdminSearchFilterBarProps) {
  const [isOpen, setIsOpen] = useState(hasActiveMoreFilters);
  const hasMoreFilters = Boolean(children);

  return (
    <section className="space-y-2 rounded-[1.25rem] border border-border bg-white p-2.5 shadow-[0_12px_22px_-22px_rgba(0,81,162,0.1)] sm:rounded-[1.35rem] sm:p-3">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <label className="relative block min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 w-full rounded-[0.95rem] border border-border bg-input pl-8.5 pr-3 text-[11px] leading-4 outline-none transition placeholder:text-[11px] focus:border-[color:var(--border-strong)] focus:ring-3 focus:ring-primary/12"
          />
        </label>

        <div className="flex shrink-0 items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-[0.95rem] px-2.5 text-[11px] leading-4 sm:px-3"
            onClick={() => setIsOpen((open) => !open)}
            disabled={!hasMoreFilters}
            aria-label="More Filter"
            title="More Filter"
            aria-expanded={hasMoreFilters ? isOpen : undefined}
          >
            <SlidersHorizontal className="size-3.5" />
            <span className="hidden sm:inline">More Filter</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="size-8 rounded-[0.95rem]"
            onClick={onReset}
            disabled={!hasActiveFilters}
            aria-label="Reset filters"
            title="Reset filters"
          >
            <RotateCcw className="size-3.5" />
          </Button>

          {actions}
        </div>
      </div>

      {hasMoreFilters ? (
        <AdminMoreFilterPanel open={hasActiveMoreFilters || isOpen}>
          {children}
        </AdminMoreFilterPanel>
      ) : null}
    </section>
  );
}
