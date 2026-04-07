import { AdminTableOpenLink } from "@/features/admin/components/admin-table-actions";
import { formatAdminDate, getTimeSlotLabel } from "@/features/admin/lib/server/admin-service";

type AdminSquadMobileCardProps = {
  openHref: string;
  squad: {
    id: string;
    name: string;
    alias: string;
    phone: string | null;
    email: string | null;
    isActive: boolean;
    _count: {
      bookings: number;
    };
    bookings: Array<{
      bookingCode: string;
      bookingDate: Date;
      timeSlot: string;
      contactName: string;
      serviceType: {
        name: string;
      };
    }>;
  };
};

export function AdminSquadMobileCard({
  openHref,
  squad,
}: AdminSquadMobileCardProps) {
  const nextAssignment = squad.bookings[0];

  return (
    <article className="rounded-[1.15rem] border border-border/70 bg-white/94 px-3.5 py-3 shadow-[0_12px_24px_-26px_rgba(15,23,42,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/10 px-2 text-[10px] font-semibold leading-4 text-primary">
              {squad.alias}
            </span>
            <p className="truncate text-[12px] font-semibold leading-5 text-foreground">
              {squad.name}
            </p>
          </div>
          <p className="mt-1 truncate text-[11px] leading-4 text-muted-foreground">
            {squad.phone || squad.email || "No contact details"}
          </p>
          <p className="mt-0.5 truncate text-[11px] leading-4 text-muted-foreground">
            {squad.email || "No email"}
          </p>
        </div>

        <AdminTableOpenLink href={openHref}>Open</AdminTableOpenLink>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-4 text-muted-foreground">
        <span className={squad.isActive ? "text-emerald-700" : "text-rose-700"}>
          {squad.isActive ? "Active" : "Inactive"}
        </span>
        <span className="text-border">|</span>
        <span>Bookings: {squad._count.bookings}</span>
      </div>

      <div className="mt-2 rounded-[0.95rem] bg-muted/35 px-3 py-2 text-[11px] leading-4 text-muted-foreground">
        {nextAssignment ? (
          <>
            Next: {formatAdminDate(nextAssignment.bookingDate)} | {getTimeSlotLabel(nextAssignment.timeSlot)} | {nextAssignment.contactName}
          </>
        ) : (
          "No upcoming assignments"
        )}
      </div>
    </article>
  );
}
