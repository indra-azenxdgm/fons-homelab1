"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Clock3, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { pushAppToast } from "@/components/app-toast-viewport";
import { Button } from "@/components/ui/button";
import {
  BackendApiError,
  patchAdminCalendarSlotOverrideBrowser,
} from "@/features/admin/api/calendar-browser-api";
import {
  calendarSlotStatusOptions,
  getCalendarStatusLabel,
} from "@/features/admin/components/admin-calendar-status-options";
import type { BookingDayStatus, TimeSlot } from "@/features/booking/constants";

type AdminCalendarSlotStatusControlProps = {
  date: string;
  timeSlot: TimeSlot;
  slotLabel: string;
  currentStatus: BookingDayStatus;
  currentReason: string | null;
  bookingCount: number;
  isBookingCountFiltered: boolean;
  dayStatus: BookingDayStatus;
};

function getCalendarSlotStatusErrorMessage(error: BackendApiError) {
  if (error.code === "forbidden_admin") {
    return "Your account cannot update calendar slot status.";
  }

  return error.message || "Unable to update the selected slot status.";
}

export function AdminCalendarSlotStatusControl({
  date,
  timeSlot,
  slotLabel,
  currentStatus,
  currentReason,
  bookingCount,
  isBookingCountFiltered,
  dayStatus,
}: AdminCalendarSlotStatusControlProps) {
  const router = useRouter();
  const isLimitedByDayOverride = dayStatus !== "OPEN";
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<BookingDayStatus>(currentStatus);
  const [reason, setReason] = useState(currentReason || "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedStatus(currentStatus);
      setReason(currentReason || "");
      setError(null);
      setIsSubmitting(false);
    }
  }, [currentReason, currentStatus, isOpen]);

  const selectedOption = useMemo(
    () => calendarSlotStatusOptions.find((option) => option.value === selectedStatus) || calendarSlotStatusOptions[0],
    [selectedStatus],
  );

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await patchAdminCalendarSlotOverrideBrowser({
        date,
        timeSlot,
        status: selectedStatus,
        reason,
      });

      pushAppToast({
        title: "Slot status updated",
        description: `${date} at ${slotLabel} is now marked as ${getCalendarStatusLabel(selectedStatus)}.`,
      });
      setIsOpen(false);
      router.refresh();
    } catch (nextError) {
      setError(
        nextError instanceof BackendApiError
          ? getCalendarSlotStatusErrorMessage(nextError)
          : "Unable to update the selected slot status.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={`rounded-full px-3 ${isLimitedByDayOverride ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100" : ""}`}
        title={
          isLimitedByDayOverride
            ? "Day-level override has priority. Slot changes apply after the day is reopened."
            : "Update slot status"
        }
        onClick={() => setIsOpen(true)}
      >
        <Clock3 className="mr-1.5 size-3.5" />
        {isLimitedByDayOverride ? "Day locked" : "Override"}
      </Button>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-slate-950/28 transition data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-[80] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[1.4rem] border border-border/80 bg-white p-5 shadow-[0_22px_42px_-28px_rgba(15,23,42,0.28)] outline-none transition data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <Dialog.Title className="text-[1rem] font-semibold leading-5 text-foreground">
            Update slot status
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-[13px] leading-5 text-muted-foreground">
            This affects new public bookings for <span className="font-medium text-foreground">{date}</span> at <span className="font-medium text-foreground">{slotLabel}</span> only.
            Existing bookings remain visible and unchanged.
          </Dialog.Description>

          {dayStatus !== "OPEN" ? (
            <div className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-5 text-amber-800">
              The day status still has priority. Slot changes will only affect public availability after the day is reopened.
            </div>
          ) : null}

          {bookingCount > 0 ? (
            <div className="mt-4 rounded-[1rem] border border-border/70 bg-muted/15 px-4 py-3 text-[12px] leading-5 text-muted-foreground">
              {bookingCount} {isBookingCountFiltered ? "visible " : ""}existing booking{bookingCount === 1 ? "" : "s"} in this slot will remain unchanged.
              {isBookingCountFiltered ? " Bookings hidden by current filters remain unchanged too." : null}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium leading-4 text-foreground">Status</span>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as BookingDayStatus)}
                className="h-11 w-full rounded-[1rem] border border-border/80 bg-white px-3 text-[13px] text-foreground outline-none transition focus:border-primary"
              >
                {calendarSlotStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-[1rem] border border-border/70 bg-muted/15 px-4 py-3 text-[12px] leading-5 text-muted-foreground">
              {selectedOption.helper}
            </div>

            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium leading-4 text-foreground">Reason</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                maxLength={240}
                placeholder={
                  selectedStatus === "CLOSED"
                    ? "Optional note, for example: Team unavailable."
                    : selectedStatus === "FULL_BOOKED"
                      ? "Optional note, for example: Slot capacity reserved."
                      : "Optional note about why the slot was reopened."
                }
                className="min-h-24 w-full rounded-[1rem] border border-border/80 bg-white px-3 py-2.5 text-[13px] text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary"
              />
            </label>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-[11px] text-destructive">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-end gap-2">
            <Dialog.Close className="inline-flex h-10 items-center justify-center rounded-full border border-border/80 bg-white px-4 text-[12px] font-medium text-foreground transition hover:bg-muted">
              Cancel
            </Dialog.Close>
            <Button
              type="button"
              className="rounded-full px-4"
              disabled={isSubmitting}
              onClick={() => void handleSubmit()}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-1.5 size-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save status"
              )}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
