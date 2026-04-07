import { AdminApiErrorState } from "@/features/admin/components/admin-api-error-state";
import { AdminBookingDetailDrawer } from "@/features/admin/components/admin-booking-detail-drawer";
import { AdminBookingsFilters } from "@/features/admin/components/admin-bookings-filters";
import { AdminBookingsList } from "@/features/admin/components/admin-bookings-list";
import { adminHasPermission } from "@/features/admin/lib/auth";
import {
  bookingStatusOptions,
  getAdminBookingDetail,
  getAdminBookings,
  getAdminServiceTypes,
  getAdminSquads,
} from "@/features/admin/lib/server/admin-service";
import { getAdminDataErrorMessage } from "@/features/admin/lib/server/admin-error-message";
import { requireAdminPagePermission } from "@/features/admin/lib/page-auth";

type AdminBookingsPageProps = {
  searchParams: Promise<{
    q?: string;
    date?: string;
    status?: string;
    assignedSquadId?: string;
    serviceTypeId?: string;
    page?: string;
    booking?: string;
  }>;
};

export default async function AdminBookingsPage({
  searchParams,
}: AdminBookingsPageProps) {
  const adminUser = await requireAdminPagePermission("bookings.read");
  const canUpdateBooking = adminHasPermission(adminUser, "bookings.update");

  const filters = await searchParams;
  let loadError: string | null = null;
  let bookings: Awaited<ReturnType<typeof getAdminBookings>> | null = null;
  let squads: Awaited<ReturnType<typeof getAdminSquads>> = [];
  let serviceTypes: Awaited<ReturnType<typeof getAdminServiceTypes>> = [];
  let selectedBooking: Awaited<ReturnType<typeof getAdminBookingDetail>> | null = null;
  let selectedBookingError: string | null = null;

  try {
    [bookings, squads, serviceTypes] = await Promise.all([
      getAdminBookings(filters),
      getAdminSquads(),
      getAdminServiceTypes(),
    ]);
  } catch (error) {
    loadError = getAdminDataErrorMessage(error, "Bookings could not be loaded right now.");
  }

  if (loadError || !bookings) {
    return <AdminApiErrorState title="Bookings unavailable" message={loadError || "Bookings could not be loaded right now."} />;
  }

  if (filters.booking) {
    try {
      selectedBooking = await getAdminBookingDetail(filters.booking);
    } catch (error) {
      selectedBookingError = getAdminDataErrorMessage(
        error,
        "Booking details could not be loaded right now.",
      );
    }
  }

  return (
    <section className="space-y-4">
      <AdminBookingsFilters
        key={`${filters.q || ""}:${filters.date || ""}:${filters.status || ""}:${filters.assignedSquadId || ""}:${filters.serviceTypeId || ""}`}
        q={filters.q}
        date={filters.date}
        status={filters.status}
        assignedSquadId={filters.assignedSquadId}
        serviceTypeId={filters.serviceTypeId}
        statusOptions={bookingStatusOptions}
        squads={squads}
        serviceTypes={serviceTypes}
      />

      <AdminBookingsList
        bookings={bookings.items}
        page={bookings.page}
        totalPages={bookings.totalPages}
        q={filters.q}
        date={filters.date}
        status={filters.status}
        assignedSquadId={filters.assignedSquadId}
        serviceTypeId={filters.serviceTypeId}
        selectedBookingId={filters.booking}
      />

      <AdminBookingDetailDrawer
        bookingId={filters.booking}
        booking={selectedBooking}
        loadError={selectedBookingError}
        canUpdateBooking={canUpdateBooking}
        squads={canUpdateBooking ? squads : []}
        statusOptions={bookingStatusOptions}
      />
    </section>
  );
}
