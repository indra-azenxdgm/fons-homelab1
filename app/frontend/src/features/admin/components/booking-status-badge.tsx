import type { BookingStatus } from "@/features/booking/constants";

import { cn } from "@/lib/utils";

export const bookingStatusBadgeStyles: Record<BookingStatus, string> = {
  PENDING: "border border-amber-300 bg-amber-50 text-amber-800",
  CONFIRMED: "border border-sky-300 bg-sky-50 text-sky-800",
  ASSIGNED: "border border-indigo-300 bg-indigo-50 text-indigo-800",
  IN_PROGRESS: "border border-violet-300 bg-violet-50 text-violet-800",
  COMPLETED: "border border-emerald-300 bg-emerald-50 text-emerald-800",
  PAID: "border border-teal-300 bg-teal-50 text-teal-800",
  CANCELLED: "border border-rose-300 bg-rose-50 text-rose-800",
};

export const bookingStatusSurfaceStyles: Record<BookingStatus, string> = {
  PENDING:
    "border-amber-200/90 bg-amber-50/90 shadow-[0_18px_36px_-30px_rgba(245,158,11,0.24)]",
  CONFIRMED:
    "border-sky-200/90 bg-sky-50/90 shadow-[0_18px_36px_-30px_rgba(14,165,233,0.2)]",
  ASSIGNED:
    "border-indigo-200/90 bg-indigo-50/90 shadow-[0_18px_36px_-30px_rgba(99,102,241,0.2)]",
  IN_PROGRESS:
    "border-violet-200/90 bg-violet-50/90 shadow-[0_18px_36px_-30px_rgba(139,92,246,0.2)]",
  COMPLETED:
    "border-emerald-200/90 bg-emerald-50/90 shadow-[0_18px_36px_-30px_rgba(16,185,129,0.2)]",
  PAID:
    "border-teal-200/90 bg-teal-50/90 shadow-[0_18px_36px_-30px_rgba(20,184,166,0.2)]",
  CANCELLED:
    "border-rose-200/90 bg-rose-50/90 shadow-[0_18px_36px_-30px_rgba(244,63,94,0.18)]",
};

export function BookingStatusBadge({
  status,
  size = "default",
}: {
  status: BookingStatus;
  size?: "default" | "compact";
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center rounded-full border font-semibold uppercase whitespace-nowrap",
        size === "compact"
          ? "px-1.5 py-px text-[7px] leading-4 tracking-[0.06em]"
          : "px-2 py-0.5 text-[8px] leading-4 tracking-[0.09em]",
        bookingStatusBadgeStyles[status],
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
