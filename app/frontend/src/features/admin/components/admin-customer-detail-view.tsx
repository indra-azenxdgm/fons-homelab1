import { AdminAssignedSquads } from "@/features/admin/components/admin-assigned-squads";
import { BookingStatusBadge } from "@/features/admin/components/booking-status-badge";
import { AdminTableOpenLink } from "@/features/admin/components/admin-table-actions";
import type { AdminCustomerDetail } from "@/features/admin/lib/shared/admin-customer-types";
import { getTimeSlotLabel } from "@/features/booking/constants";
import { cn } from "@/lib/utils";

type AdminCustomerDetailViewProps = {
  customer: AdminCustomerDetail;
  canReadBookings: boolean;
  layout?: "page" | "drawer";
};

function formatAdminDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function detailItemClassName(layout: "page" | "drawer") {
  return layout === "drawer"
    ? "rounded-[1rem] border border-[#D8E7F5] bg-white/88 p-2.5"
    : "panel-muted p-4";
}

export function AdminCustomerDetailView({
  customer,
  canReadBookings,
  layout = "page",
}: AdminCustomerDetailViewProps) {
  const latestBooking = customer.bookings[0];
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
              Name
            </p>
            <p className="mt-1 text-[11px] font-semibold text-foreground">{customer.fullName}</p>
          </div>
          <div className={detailItemClassName(layout)}>
            <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
              Phone
            </p>
            <p className="mt-1 text-[11px] font-medium text-foreground">{customer.phone}</p>
          </div>
          <div className={detailItemClassName(layout)}>
            <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
              Email
            </p>
            <p className="mt-1 text-[11px] font-medium text-foreground">
              {customer.email || "Not provided"}
            </p>
          </div>
          <div className={detailItemClassName(layout)}>
            <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
              Total bookings
            </p>
            <p className="mt-1 text-[11px] font-medium text-foreground">{customer._count.bookings}</p>
          </div>
          <div className={detailItemClassName(layout)}>
            <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
              Latest booking
            </p>
            <p className="mt-1 text-[11px] font-medium text-foreground">
              {latestBooking ? formatAdminDate(latestBooking.bookingDate) : "No bookings"}
            </p>
          </div>
          <div className={detailItemClassName(layout)}>
            <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
              CRM note
            </p>
            <p className="mt-1 text-[11px] leading-4 text-foreground">
              {customer.notes || "No customer notes yet"}
            </p>
          </div>
        </div>
      </div>

      <div className={sectionClassName}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className={cn(isDrawer ? "text-[11px] font-semibold leading-4" : "text-sm font-semibold leading-4")}>Recent booking history</h2>
            <p className={cn(isDrawer ? "mt-1 text-[11px] leading-4 text-muted-foreground" : "mt-1 text-[11px] leading-4 text-muted-foreground")}>
              Latest jobs tied to this customer profile.
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {customer.bookings.length ? (
            customer.bookings.map((booking) => (
              <article
                key={booking.id}
                className={cn("rounded-[1rem] border border-[#D8E7F5] bg-white/88", isDrawer ? "p-3" : "p-3.5")}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn(isDrawer ? "text-[11px] font-semibold text-foreground" : "text-sm font-semibold text-foreground")}>{booking.bookingCode}</p>
                        <BookingStatusBadge status={booking.status} />
                      </div>
                      <p className={cn(isDrawer ? "mt-1 text-[11px] leading-4 text-muted-foreground" : "mt-1 text-[11px] leading-4 text-muted-foreground")}>
                        {formatAdminDate(booking.bookingDate)} | {getTimeSlotLabel(booking.timeSlot)}
                      </p>
                    </div>
                    {canReadBookings ? (
                      <AdminTableOpenLink href={`/admin/bookings?booking=${booking.id}`}>
                        Open booking
                      </AdminTableOpenLink>
                    ) : (
                      <span className="inline-flex h-7 min-w-14 items-center justify-center rounded-full border border-border/70 px-2.5 text-[10px] font-medium text-muted-foreground">
                        Restricted
                      </span>
                    )}
                  </div>

                  <div className={cn("grid gap-x-2 gap-y-2", isDrawer ? "grid-cols-2" : "sm:grid-cols-2")}>
                    <div>
                      <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
                        Service
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-foreground">{booking.serviceType.name}</p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
                        Squads
                      </p>
                      <div className="mt-1.5">
                        <AdminAssignedSquads
                          squads={booking.assignedSquads}
                          variant="chips"
                          maxVisible={booking.assignedSquads.length || 1}
                          aliasOnly
                          showOverflowSummary={false}
                          className="gap-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className={cn(isDrawer ? "text-[11px] leading-4 text-muted-foreground" : "text-[11px] leading-4 text-muted-foreground")}>No booking history yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
