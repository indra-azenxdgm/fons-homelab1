import { AdminTableOpenLink } from "@/features/admin/components/admin-table-actions";
import { formatAdminDate } from "@/features/admin/lib/server/admin-service";

type AdminCustomerMobileCardProps = {
  openHref: string;
  customer: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    _count: {
      bookings: number;
    };
    bookings: Array<{
      bookingDate: Date;
    }>;
  };
};

export function AdminCustomerMobileCard({
  openHref,
  customer,
}: AdminCustomerMobileCardProps) {
  return (
    <article className="rounded-[1.1rem] border border-border/70 bg-white/94 px-3.5 py-3 shadow-[0_12px_24px_-26px_rgba(15,23,42,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold leading-5 text-foreground">
            {customer.fullName}
          </p>
          <a
            href={`tel:${customer.phone}`}
            className="mt-1 block truncate text-[12px] leading-5 text-muted-foreground"
          >
            {customer.phone}
          </a>
          <a
            href={customer.email ? `mailto:${customer.email}` : undefined}
            className="mt-0.5 block truncate text-[11px] leading-4 text-muted-foreground"
          >
            {customer.email || "No email"}
          </a>
        </div>

        <AdminTableOpenLink href={openHref}>Open</AdminTableOpenLink>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-4 text-muted-foreground">
        <span>Bookings: {customer._count.bookings}</span>
        <span className="text-border">|</span>
        <span>
          Latest: {customer.bookings[0]
            ? formatAdminDate(customer.bookings[0].bookingDate)
            : "No bookings"}
        </span>
      </div>
    </article>
  );
}
