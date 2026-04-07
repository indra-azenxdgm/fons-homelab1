"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, LoaderCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pushAppToast } from "@/components/app-toast-viewport";
import {
  BackendApiError,
  updateAdminBookingBrowser,
} from "@/features/admin/api/admin-browser-api";
import { bookingStatusSurfaceStyles } from "@/features/admin/components/booking-status-badge";
import type { AdminBookingDetail } from "@/features/admin/lib/shared/admin-booking-types";
import type { BookingStatus } from "@/features/booking/constants";
import { cn } from "@/lib/utils";

type AdminBookingUpdateFormProps = {
  bookingId: string;
  currentStatus: string;
  currentAssignedSquadIds: string[];
  statusOptions: string[];
  squads: Array<{
    id: string;
    name: string;
    alias: string;
  }>;
  onUpdated?: (booking: AdminBookingDetail) => void;
  layout?: "sidebar" | "drawer";
};

function getSquadLabel(squad: { alias: string; name: string }) {
  return squad.alias;
}

export function AdminBookingUpdateForm({
  bookingId,
  currentStatus,
  currentAssignedSquadIds,
  statusOptions,
  squads,
  onUpdated,
  layout = "sidebar",
}: AdminBookingUpdateFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSquadPickerOpen, setIsSquadPickerOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [selectedSquadIds, setSelectedSquadIds] = useState(currentAssignedSquadIds);

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  useEffect(() => {
    setSelectedSquadIds(currentAssignedSquadIds);
  }, [currentAssignedSquadIds]);

  const selectedSquads = useMemo(
    () =>
      squads.filter((squad) => selectedSquadIds.includes(squad.id)),
    [selectedSquadIds, squads],
  );

  const squadSummary =
    selectedSquads.length === 0
      ? "Unassigned"
      : selectedSquads.length === 1
        ? getSquadLabel(selectedSquads[0])
        : `${getSquadLabel(selectedSquads[0])} +${selectedSquads.length - 1}`;
  const drawerSurfaceClassName =
    bookingStatusSurfaceStyles[selectedStatus as BookingStatus] ||
    "border-emerald-200/80 bg-[#F2FBF5] shadow-[0_18px_36px_-30px_rgba(16,185,129,0.18)]";

  function toggleSquadSelection(squadId: string) {
    setSelectedSquadIds((current) =>
      current.includes(squadId)
        ? current.filter((id) => id !== squadId)
        : [...current, squadId],
    );
  }

  async function onSubmit() {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await updateAdminBookingBrowser(bookingId, {
        status: selectedStatus,
        assignedSquadIds: selectedSquadIds,
      });

      setIsSquadPickerOpen(false);
      onUpdated?.(result.booking);
      pushAppToast({
        title: "Booking updated",
        description: "Changes saved successfully.",
      });
      router.refresh();
    } catch (error) {
      setError(
        error instanceof BackendApiError
          ? error.message || "Unable to update booking"
          : "Unable to update booking",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      action={onSubmit}
      className={cn(
        "space-y-4",
        layout === "sidebar"
          ? "panel sticky top-4 p-5"
          : cn(
              "overflow-visible rounded-[1.28rem] border",
              drawerSurfaceClassName,
            ),
      )}
    >
      <div className={cn("space-y-4", layout === "drawer" && "p-4")}>
        <div className="space-y-1">
          <p className="text-sm leading-4 font-semibold">Update booking</p>
          <p className="text-[11px] leading-4 text-muted-foreground">
            Adjust the booking status and assign one or more squads.
          </p>
        </div>

        <div className={cn(layout === "drawer" ? "grid grid-cols-2 gap-2" : "space-y-4")}>
          <label className="block space-y-1.5">
            <span className="text-[11px] leading-4 font-medium">Booking status</span>
            <select
              name="status"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="h-8 w-full rounded-2xl border border-border/80 bg-white/92 px-2.5 py-1.5 text-[11px] leading-4 outline-none focus:border-primary"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <div className="min-w-0 space-y-1.5">
            <span className="text-[11px] leading-4 font-medium">Assigned squads</span>
            <div className="relative">
              <button
                type="button"
                className="flex h-8 w-full items-center justify-between rounded-2xl border border-border/80 bg-white/92 px-2.5 py-1.5 text-left text-[11px] leading-4 transition hover:bg-white"
                onClick={() => setIsSquadPickerOpen((open) => !open)}
                aria-expanded={isSquadPickerOpen}
                aria-haspopup="listbox"
              >
                <span className={cn("truncate", selectedSquads.length === 0 && "text-muted-foreground")}>
                  {squadSummary}
                </span>
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              </button>

              {isSquadPickerOpen ? (
                <div className="absolute left-0 top-full z-40 mt-2 w-full min-w-0 rounded-[1.25rem] border border-border/80 bg-white p-2 shadow-[0_24px_48px_-28px_rgba(15,23,42,0.32)]">
                  <div className="max-h-60 overflow-y-auto overscroll-contain pr-1">
                    {squads.map((squad) => {
                      const checked = selectedSquadIds.includes(squad.id);

                      return (
                        <button
                          key={squad.id}
                          type="button"
                          className="flex min-h-10 w-full items-center justify-between gap-2 rounded-[1rem] px-2.5 py-2 text-left text-[11px] leading-4 transition hover:bg-muted/45"
                          onClick={() => toggleSquadSelection(squad.id)}
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">{getSquadLabel(squad)}</p>
                            <p className="truncate text-[10px] text-muted-foreground">{squad.name}</p>
                          </div>
                          <span
                            className={cn(
                              "inline-flex size-5 items-center justify-center rounded-full border",
                              checked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-white text-transparent",
                            )}
                          >
                            <Check className="size-3" />
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-border/70 px-2 pt-2">
                    <button
                      type="button"
                      className="text-[10px] font-medium text-muted-foreground transition hover:text-foreground"
                      onClick={() => setSelectedSquadIds([])}
                    >
                      Clear selection
                    </button>
                    <button
                      type="button"
                      className="text-[10px] font-medium text-primary transition hover:text-primary/80"
                      onClick={() => setIsSquadPickerOpen(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          {selectedSquads.length ? (
            <div className={cn("flex flex-wrap gap-2", layout === "drawer" && "col-span-2 -mt-1")}>
              {selectedSquads.map((squad) => (
                <button
                  key={squad.id}
                  type="button"
                  onClick={() => toggleSquadSelection(squad.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-white/95 px-2 py-0.5 text-[8px] leading-4 font-medium text-muted-foreground transition hover:border-border hover:text-foreground"
                >
                  {getSquadLabel(squad)}
                  <X className="size-3" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {layout === "sidebar" && error ? (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-[11px] text-destructive">
            {error}
          </div>
        ) : null}

      </div>

      {layout === "drawer" ? (
        <div className={cn("sticky bottom-0 border-t px-5 py-3 backdrop-blur", drawerSurfaceClassName)}>
          {error ? (
            <div className="mb-3 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-[11px] text-destructive">
              {error}
            </div>
          ) : null}

          <Button type="submit" size="lg" className="h-8 w-full rounded-full px-3 text-[11px]" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Saving changes
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      ) : (
        <Button type="submit" size="lg" className="h-8 rounded-full px-3 text-[11px]" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Saving changes
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      )}
    </form>
  );
}
