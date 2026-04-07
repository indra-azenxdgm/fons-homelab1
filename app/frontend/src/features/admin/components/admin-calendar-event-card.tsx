import Link from "next/link";
import { Clock3, Phone } from "lucide-react";
import type { BookingStatus } from "@/features/booking/constants";

import { AdminAssignedSquads } from "@/features/admin/components/admin-assigned-squads";
import { getAdminBookingServiceDisplayLabel } from "@/features/admin/lib/shared/admin-booking-service-display";
import { formatAdminStatusLabel } from "@/features/admin/lib/shared/admin-filter-utils";
import { getTimeSlotLabel } from "@/features/admin/lib/server/admin-service";
import { cn } from "@/lib/utils";

const statusColorMap: Record<BookingStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  CONFIRMED: "border-sky-200 bg-sky-50 text-sky-800",
  ASSIGNED: "border-indigo-200 bg-indigo-50 text-indigo-800",
  IN_PROGRESS: "border-violet-200 bg-violet-50 text-violet-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  PAID: "border-teal-200 bg-teal-50 text-teal-800",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
};

type AdminCalendarEventCardProps = {
  booking: {
    id: string;
    bookingCode: string;
    bookingDate: Date;
    timeSlot: string;
    status: BookingStatus;
    contactName: string;
    contactPhone: string;
    serviceDisplayName: string | null;
    serviceVariant: string | null;
    serviceIssue: string | null;
    serviceComplaint: string | null;
    serviceType: {
      name: string;
    };
    assignedSquads: Array<{
      id: string;
      alias: string;
      name: string;
    }>;
  };
  compact?: boolean;
  href?: string;
  scroll?: boolean;
  selected?: boolean;
  className?: string;
};

export function AdminCalendarEventCard({
  booking,
  compact = false,
  href,
  scroll,
  selected = false,
  className,
}: AdminCalendarEventCardProps) {
  const serviceLabel = getAdminBookingServiceDisplayLabel(booking);

  return (
    <Link
      href={href || `/admin/bookings/${booking.id}`}
      scroll={scroll}
      className={cn(
        "block rounded-[1.1rem] border border-border/70 bg-white transition hover:bg-muted/25",
        compact ? "px-3.5 py-3" : "px-4 py-3.5",
        selected && "border-primary/45 ring-1 ring-primary/20",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`admin-pill-text inline-flex rounded-full border px-2 py-1 ${statusColorMap[booking.status]}`}>
            {formatAdminStatusLabel(booking.status)}
          </p>
          <p className="mt-2 truncate text-[12px] font-semibold leading-5 text-foreground">
            {booking.contactName}
          </p>
          <p className="truncate text-[12px] leading-5 text-muted-foreground" title={serviceLabel}>
            {serviceLabel}
          </p>
        </div>
        <div className="rounded-[0.95rem] bg-primary px-3 py-2 text-center text-primary-foreground">
          <p className="text-base font-semibold leading-none">
            {booking.bookingDate.getUTCDate()}
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-primary-foreground/80">
            Day
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-4 text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock3 className="size-3.5" />
          {getTimeSlotLabel(booking.timeSlot)}
        </span>
        <span>{booking.bookingCode}</span>
        <AdminAssignedSquads squads={booking.assignedSquads} variant="compact" />
        {compact ? (
          <span className="inline-flex items-center gap-1">
            <Phone className="size-3.5" />
            {booking.contactPhone}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
