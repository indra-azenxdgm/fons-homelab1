import { AdminApiErrorState } from "@/features/admin/components/admin-api-error-state";
import { AdminCalendarMonth } from "@/features/admin/components/admin-calendar-month";
import { getAdminCalendarMonth } from "@/features/admin/lib/server/admin-service";
import { getAdminDataErrorMessage } from "@/features/admin/lib/server/admin-error-message";
import { requireAdminPagePermission } from "@/features/admin/lib/page-auth";

type AdminCalendarPageProps = {
  searchParams: Promise<{
    q?: string;
    month?: string;
    day?: string;
    view?: string;
    status?: string;
    assignedSquadId?: string;
    serviceTypeId?: string;
  }>;
};

export default async function AdminCalendarPage({
  searchParams,
}: AdminCalendarPageProps) {
  await requireAdminPagePermission("dashboard.read");
  const filters = await searchParams;
  let loadError: string | null = null;
  let calendarMonth: Awaited<ReturnType<typeof getAdminCalendarMonth>> | null = null;

  try {
    calendarMonth = await getAdminCalendarMonth(filters);
  } catch (error) {
    loadError = getAdminDataErrorMessage(error, "Calendar data could not be loaded right now.");
  }

  if (loadError || !calendarMonth) {
    return <AdminApiErrorState title="Calendar unavailable" message={loadError || "Calendar data could not be loaded right now."} />;
  }

  return (
    <AdminCalendarMonth
      monthStart={calendarMonth.monthStart}
      selectedDate={calendarMonth.selectedDate}
      bookings={calendarMonth.bookings}
      serviceTypes={calendarMonth.serviceTypes}
      squads={calendarMonth.squads}
      appliedFilters={calendarMonth.appliedFilters}
    />
  );
}
