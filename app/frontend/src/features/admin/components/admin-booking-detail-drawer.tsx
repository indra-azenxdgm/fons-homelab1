"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AdminApiErrorState } from "@/features/admin/components/admin-api-error-state";
import { AdminBookingDetailView } from "@/features/admin/components/admin-booking-detail-view";
import { AdminDrawer } from "@/features/admin/components/admin-drawer";
import { BookingStatusBadge } from "@/features/admin/components/booking-status-badge";
import type { AdminBookingDetail, SquadOption } from "@/features/admin/lib/shared/admin-booking-types";

type AdminBookingDetailDrawerProps = {
  bookingId?: string;
  booking: AdminBookingDetail | null;
  loadError?: string | null;
  canUpdateBooking: boolean;
  squads: SquadOption[];
  statusOptions: string[];
};

function formatAdminDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function AdminBookingDetailDrawer({
  bookingId,
  booking,
  loadError,
  canUpdateBooking,
  squads,
  statusOptions,
}: AdminBookingDetailDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isOpen = Boolean(bookingId);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("booking");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <AdminDrawer
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={
        booking ? (
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {booking.bookingCode}
              </span>
              <BookingStatusBadge status={booking.status} />
            </div>
          </div>
        ) : (
          "Booking details"
        )
      }
      description={
        booking
          ? `Created ${formatAdminDate(booking.createdAt)}`
          : "Inspect booking details and update assignment without leaving the bookings workspace."
      }
      className="max-w-full sm:max-w-[44rem] xl:max-w-[56rem]"
    >
      {loadError ? (
        <AdminApiErrorState
          title="Booking detail unavailable"
          message={loadError}
        />
      ) : booking ? (
        <AdminBookingDetailView
          booking={booking}
          canUpdateBooking={canUpdateBooking}
          squads={squads}
          statusOptions={statusOptions}
          layout="drawer"
        />
      ) : (
        <AdminApiErrorState
          title="Booking not found"
          message="The selected booking could not be found."
        />
      )}
    </AdminDrawer>
  );
}
