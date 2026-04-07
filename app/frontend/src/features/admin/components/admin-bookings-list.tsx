import Link from "next/link";
import { cn } from "@/lib/utils";

import { AdminAssignedSquads } from "@/features/admin/components/admin-assigned-squads";
import { AdminCalendarEventCard } from "@/features/admin/components/admin-calendar-event-card";
import {
  AdminTableOpenLink,
  adminTableActionsCellClassName,
  adminTableActionsHeaderClassName,
} from "@/features/admin/components/admin-table-actions";
import {
  BookingStatusBadge,
} from "@/features/admin/components/booking-status-badge";
import { getAdminBookingServiceDisplayLabel } from "@/features/admin/lib/shared/admin-booking-service-display";
import {
  formatAdminDate,
  getTimeSlotLabel,
} from "@/features/admin/lib/server/admin-service";
import type { BookingStatus } from "@/features/booking/constants";

type AdminBookingsListProps = {
  bookings: Array<{
    id: string;
    bookingCode: string;
    bookingDate: Date;
    timeSlot: string;
    contactName: string;
    contactPhone: string;
    status: BookingStatus;
    serviceDisplayName: string | null;
    serviceVariant: string | null;
    serviceIssue: string | null;
    serviceComplaint: string | null;
    serviceType: {
      name: string;
    };
    assignedSquads: Array<{
      id: string;
      name: string;
      alias: string;
    }>;
  }>;
  page: number;
  totalPages: number;
  q?: string;
  date?: string;
  status?: string;
  assignedSquadId?: string;
  serviceTypeId?: string;
  selectedBookingId?: string;
};

export function buildAdminBookingsHref({
  page,
  q,
  date,
  status,
  assignedSquadId,
  serviceTypeId,
  booking,
}: {
  page: number;
  q?: string;
  date?: string;
  status?: string;
  assignedSquadId?: string;
  serviceTypeId?: string;
  booking?: string;
}) {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (date) {
    params.set("date", date);
  }

  if (status) {
    params.set("status", status);
  }

  if (assignedSquadId) {
    params.set("assignedSquadId", assignedSquadId);
  }

  if (serviceTypeId) {
    params.set("serviceTypeId", serviceTypeId);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  if (booking) {
    params.set("booking", booking);
  }

  const query = params.toString();

  return query ? `/admin/bookings?${query}` : "/admin/bookings";
}

export function AdminBookingsList({
  bookings,
  page,
  totalPages,
  q,
  date,
  status,
  assignedSquadId,
  serviceTypeId,
  selectedBookingId,
}: AdminBookingsListProps) {
  if (bookings.length === 0) {
    return (
      <section className="rounded-[1.6rem] border border-dashed border-border/80 bg-white/80 p-8 text-center">
        <p className="admin-empty-title">No bookings found</p>
        <p className="admin-empty-copy mt-2">
          Adjust the search keyword or filters to find matching bookings.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="grid gap-3 lg:hidden">
        {bookings.map((booking) => (
          <AdminCalendarEventCard
            key={booking.id}
            booking={booking}
            compact
            href={buildAdminBookingsHref({
              page,
              q,
              date,
              status,
              assignedSquadId,
              serviceTypeId,
              booking: booking.id,
            })}
            scroll={false}
            selected={selectedBookingId === booking.id}
            className="bg-white/92 shadow-[0_14px_30px_-30px_rgba(15,23,42,0.18)]"
          />
        ))}
      </section>

      <section className="hidden overflow-hidden rounded-[1.6rem] border border-border/70 bg-white/94 shadow-[0_20px_44px_-36px_rgba(15,23,42,0.2)] lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-[11px] leading-4">
            <thead className="bg-muted/45 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 leading-4 font-medium">Booking</th>
                <th className="px-3 py-2 leading-4 font-medium">Date</th>
                <th className="px-3 py-2 leading-4 font-medium">Customer</th>
                <th className="px-3 py-2 leading-4 font-medium">Phone</th>
                <th className="px-3 py-2 leading-4 font-medium">Service</th>
                <th className="px-3 py-2 leading-4 font-medium">Status</th>
                <th className="px-3 py-2 leading-4 font-medium">Squads</th>
                <th className={adminTableActionsHeaderClassName}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className={cn(
                    "border-t border-border/70 hover:bg-muted/30",
                    selectedBookingId === booking.id && "bg-primary/[0.04]",
                  )}
                >
                  <td className="px-3 py-2 font-semibold">{booking.bookingCode}</td>
                  <td className="px-3 py-2">
                    {formatAdminDate(booking.bookingDate)}
                    <div className="text-[10px] text-muted-foreground">
                      {getTimeSlotLabel(booking.timeSlot)}
                    </div>
                  </td>
                  <td className="px-3 py-2">{booking.contactName}</td>
                  <td className="px-3 py-2">{booking.contactPhone}</td>
                  <td className="px-3 py-2">
                    <span
                      className="block max-w-[18rem] truncate"
                      title={getAdminBookingServiceDisplayLabel(booking)}
                    >
                      {getAdminBookingServiceDisplayLabel(booking)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <BookingStatusBadge status={booking.status} />
                  </td>
                  <td className="px-3 py-2">
                    <AdminAssignedSquads
                      squads={booking.assignedSquads}
                      variant="compact"
                      aliasOnly
                      maxVisible={booking.assignedSquads.length || 1}
                      showOverflowSummary={false}
                    />
                  </td>
                  <td className={adminTableActionsCellClassName}>
                    <AdminTableOpenLink
                      href={buildAdminBookingsHref({
                        page,
                        q,
                        date,
                        status,
                        assignedSquadId,
                        serviceTypeId,
                        booking: booking.id,
                      })}
                      scroll={false}
                    >
                      Open
                    </AdminTableOpenLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {totalPages > 1 ? (
        <nav className="flex items-center justify-between rounded-[1.2rem] border border-border/70 bg-white/82 px-3.5 py-3 shadow-[0_12px_28px_-28px_rgba(15,23,42,0.16)] sm:px-4">
          <Link
            href={buildAdminBookingsHref({
              page: Math.max(1, page - 1),
              q,
              date,
              status,
              assignedSquadId,
              serviceTypeId,
              booking: selectedBookingId,
            })}
            aria-disabled={page <= 1}
            className={`admin-pagination-button h-8 px-3 ${
              page <= 1
                ? "pointer-events-none border-border/60 text-muted-foreground/50"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            Previous
          </Link>

          <p className="admin-pagination-text text-center">
            Page {page} of {totalPages}
          </p>

          <Link
            href={buildAdminBookingsHref({
              page: Math.min(totalPages, page + 1),
              q,
              date,
              status,
              assignedSquadId,
              serviceTypeId,
              booking: selectedBookingId,
            })}
            aria-disabled={page >= totalPages}
            className={`admin-pagination-button h-8 px-3 ${
              page >= totalPages
                ? "pointer-events-none border-border/60 text-muted-foreground/50"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            Next
          </Link>
        </nav>
      ) : null}
    </>
  );
}
