import Link from "next/link";
import { Clock3, Phone, Users } from "lucide-react";
import type { BookingStatus, TimeSlot } from "@/features/booking/constants";

import { AdminAssignedSquads } from "@/features/admin/components/admin-assigned-squads";
import { getAdminBookingServiceDisplayLabel } from "@/features/admin/lib/shared/admin-booking-service-display";
import { getTimeSlotLabel } from "@/features/admin/lib/server/admin-service";

const statusDotMap: Record<BookingStatus, string> = {
  PENDING: "bg-amber-500",
  CONFIRMED: "bg-sky-500",
  ASSIGNED: "bg-indigo-500",
  IN_PROGRESS: "bg-violet-500",
  COMPLETED: "bg-emerald-500",
  PAID: "bg-teal-500",
  CANCELLED: "bg-rose-500",
};

type AdminCalendarMobileAgendaItemProps = {
  booking: {
    id: string;
    bookingCode: string;
    timeSlot: TimeSlot;
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
};

export function AdminCalendarMobileAgendaItem({
  booking,
}: AdminCalendarMobileAgendaItemProps) {
  const serviceLabel = getAdminBookingServiceDisplayLabel(booking);

  return (
    <Link
      href={`/admin/bookings/${booking.id}`}
      className="block rounded-[1.1rem] border border-border/70 bg-white/96 px-4 py-3 shadow-[0_10px_24px_-24px_rgba(15,23,42,0.18)] transition hover:bg-muted/20"
    >
      <div className="flex items-center gap-2 text-[11px] font-medium leading-4 text-muted-foreground">
        <span className={`inline-block size-2 rounded-full ${statusDotMap[booking.status]}`} />
        <span className="inline-flex items-center gap-1">
          <Clock3 className="size-3.5" />
          {getTimeSlotLabel(booking.timeSlot)}
        </span>
      </div>

      <p className="mt-2 text-[12px] font-semibold leading-5 text-foreground">
        {booking.contactName}
      </p>
      <p className="mt-0.5 truncate text-[12px] leading-5 text-muted-foreground" title={serviceLabel}>
        {serviceLabel}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-4 text-muted-foreground">
        <span>{booking.bookingCode}</span>
        <span className="inline-flex items-center gap-1">
          <Phone className="size-3.5" />
          {booking.contactPhone}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users className="size-3.5" />
          <AdminAssignedSquads squads={booking.assignedSquads} variant="compact" />
        </span>
      </div>
    </Link>
  );
}
