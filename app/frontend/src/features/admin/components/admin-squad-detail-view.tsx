import { BookingStatusBadge } from "@/features/admin/components/booking-status-badge";
import { AdminTableOpenLink } from "@/features/admin/components/admin-table-actions";
import type { AdminSquadDetail } from "@/features/admin/lib/shared/admin-squad-types";
import { getTimeSlotLabel } from "@/features/booking/constants";
import { cn } from "@/lib/utils";

type AdminSquadDetailViewProps = {
  squad: AdminSquadDetail;
  layout?: "page" | "drawer";
};

function formatAdminDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function renderAssignmentList(
  assignments: AdminSquadDetail["upcomingAssignments"],
  layout: "page" | "drawer",
) {
  const isDrawer = layout === "drawer";

  if (!assignments.length) {
    return (
      <div className={cn("rounded-[1rem] border border-dashed border-border/70 bg-muted/18", isDrawer ? "px-3 py-3 text-[11px] leading-4" : "px-4 py-4 text-[11px] leading-4", "text-muted-foreground")}>
        No assignments in this section.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {assignments.map((assignment) => (
        <article key={assignment.id} className={cn("rounded-[1rem] border border-[#D8E7F5] bg-white/88", isDrawer ? "p-3" : "p-3.5")}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={cn(isDrawer ? "text-[11px] font-semibold text-foreground" : "text-sm font-semibold text-foreground")}>{assignment.contactName}</p>
                  <BookingStatusBadge status={assignment.status} />
                </div>
                <p className={cn(isDrawer ? "mt-1 text-[11px] leading-4 text-muted-foreground" : "mt-1 text-[11px] leading-4 text-muted-foreground")}>
                  {assignment.serviceType.name}
                </p>
              </div>
              <AdminTableOpenLink href={`/admin/bookings?booking=${assignment.id}`}>
                Open booking
              </AdminTableOpenLink>
            </div>

            <div className={cn("grid gap-x-2 gap-y-2", isDrawer ? "grid-cols-2" : "sm:grid-cols-2")}>
              <div>
                <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
                  Schedule
                </p>
                <p className="mt-1 text-[11px] font-medium text-foreground">
                  {formatAdminDate(assignment.bookingDate)} | {getTimeSlotLabel(assignment.timeSlot)}
                </p>
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
                  Booking
                </p>
                <p className="mt-1 text-[11px] font-medium text-foreground">
                  {assignment.bookingCode} | {assignment.contactPhone}
                </p>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function detailItemClassName(layout: "page" | "drawer") {
  return layout === "drawer"
    ? "rounded-[1rem] border border-[#D8E7F5] bg-white/88 p-2.5"
    : "panel-muted p-4";
}

export function AdminSquadDetailView({
  squad,
  layout = "page",
}: AdminSquadDetailViewProps) {
  const isDrawer = layout === "drawer";
  const sectionClassName = isDrawer
    ? "rounded-[1.28rem] border border-[#D8E7F5] bg-[#F7FBFF] p-3.5"
    : "panel p-5";

  return (
    <section className="space-y-3">
      <div className={sectionClassName}>
        <div className={cn("grid gap-2", isDrawer ? "grid-cols-2" : "sm:grid-cols-2")}>
          <div className={detailItemClassName(layout)}>
            <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
              Squad
            </p>
            <p className="mt-1 text-[11px] font-semibold text-foreground">{squad.name}</p>
          </div>
          <div className={detailItemClassName(layout)}>
            <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
              Alias
            </p>
            <p className="mt-1 text-[11px] font-medium text-foreground">{squad.alias}</p>
          </div>
          <div className={detailItemClassName(layout)}>
            <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
              Phone
            </p>
            <p className="mt-1 text-[11px] font-medium text-foreground">{squad.phone || "Not provided"}</p>
          </div>
          <div className={detailItemClassName(layout)}>
            <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
              Email
            </p>
            <p className="mt-1 text-[11px] font-medium text-foreground">{squad.email || "Not provided"}</p>
          </div>
          <div className={detailItemClassName(layout)}>
            <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
              Status
            </p>
            <p className={cn("mt-1 text-[11px] font-medium", squad.isActive ? "text-emerald-700" : "text-rose-700")}>
              {squad.isActive ? "Active" : "Inactive"}
            </p>
          </div>
          <div className={detailItemClassName(layout)}>
            <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
              Total assigned bookings
            </p>
            <p className="mt-1 text-[11px] font-medium text-foreground">{squad._count.bookings}</p>
          </div>
          <div className={detailItemClassName(layout)}>
            <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
              Upcoming jobs
            </p>
            <p className="mt-1 text-[11px] font-medium text-foreground">{squad.upcomingAssignments.length}</p>
          </div>
          <div className={detailItemClassName(layout)}>
            <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
              Last completed job
            </p>
            <p className="mt-1 text-[11px] font-medium text-foreground">
              {squad.pastAssignments[0] ? formatAdminDate(squad.pastAssignments[0].bookingDate) : "No history"}
            </p>
          </div>
        </div>
      </div>

      <div className={sectionClassName}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className={cn(isDrawer ? "text-[11px] font-semibold leading-4" : "text-sm font-semibold leading-4")}>Upcoming assignments</h2>
            <p className={cn(isDrawer ? "mt-1 text-[11px] leading-4 text-muted-foreground" : "mt-1 text-[11px] leading-4 text-muted-foreground")}>
              Nearest active schedule for this squad.
            </p>
          </div>
        </div>
        <div className="mt-3">{renderAssignmentList(squad.upcomingAssignments, layout)}</div>
      </div>

      <div className={sectionClassName}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className={cn(isDrawer ? "text-[11px] font-semibold leading-4" : "text-sm font-semibold leading-4")}>Past assignments</h2>
            <p className={cn(isDrawer ? "mt-1 text-[11px] leading-4 text-muted-foreground" : "mt-1 text-[11px] leading-4 text-muted-foreground")}>
              Most recent completed or previous booking work.
            </p>
          </div>
        </div>
        <div className="mt-3">{renderAssignmentList(squad.pastAssignments, layout)}</div>
      </div>
    </section>
  );
}
