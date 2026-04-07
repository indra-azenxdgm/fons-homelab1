import Link from "next/link";

import {
  AdminTableOpenLink,
  adminTableActionsCellClassName,
  adminTableActionsHeaderClassName,
} from "@/features/admin/components/admin-table-actions";
import { AdminCustomerMobileCard } from "@/features/admin/components/admin-customer-mobile-card";
import { formatAdminDate } from "@/features/admin/lib/server/admin-service";

type AdminCustomersListProps = {
  customers: Array<{
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
  }>;
  page: number;
  totalPages: number;
  q?: string;
  activity?: string;
};

function buildCustomersPageHref({
  page,
  q,
  activity,
  customer,
}: {
  page: number;
  q?: string;
  activity?: string;
  customer?: string;
}) {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (activity) {
    params.set("activity", activity);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  if (customer) {
    params.set("customer", customer);
  }

  const query = params.toString();

  return query ? `/admin/customers?${query}` : "/admin/customers";
}

export function AdminCustomersList({
  customers,
  page,
  totalPages,
  q,
  activity,
}: AdminCustomersListProps) {
  if (customers.length === 0) {
    return (
      <section className="rounded-[1.6rem] border border-dashed border-border/80 bg-white/80 p-8 text-center">
        <p className="admin-empty-title">No customers found</p>
        <p className="admin-empty-copy mt-2">
          Search by name, phone number, or email to find a customer record.
        </p>
      </section>
    );
  }

  return (
    <>
        <section className="grid gap-2.5 lg:hidden">
        {customers.map((customer) => (
          <AdminCustomerMobileCard
            key={customer.id}
            customer={customer}
            openHref={buildCustomersPageHref({ page, q, activity, customer: customer.id })}
          />
        ))}
      </section>

      <section className="hidden overflow-hidden rounded-[1.6rem] border border-border/70 bg-white/94 shadow-[0_20px_44px_-36px_rgba(15,23,42,0.2)] lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-[11px] leading-4">
            <thead className="bg-muted/45 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 leading-4 font-medium">Name</th>
                <th className="px-3 py-2 leading-4 font-medium">Phone</th>
                <th className="px-3 py-2 leading-4 font-medium">Email</th>
                <th className="px-3 py-2 leading-4 font-medium">Total bookings</th>
                <th className="px-3 py-2 leading-4 font-medium">Latest booking</th>
                <th className={adminTableActionsHeaderClassName}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-border/70 hover:bg-muted/30">
                  <td className="px-3 py-2 font-semibold">{customer.fullName}</td>
                  <td className="px-3 py-2">{customer.phone}</td>
                  <td className="px-3 py-2">{customer.email || "No email"}</td>
                  <td className="px-3 py-2">{customer._count.bookings}</td>
                  <td className="px-3 py-2">
                    {customer.bookings[0]
                      ? formatAdminDate(customer.bookings[0].bookingDate)
                      : "No bookings"}
                  </td>
                  <td className={adminTableActionsCellClassName}>
                    <AdminTableOpenLink href={buildCustomersPageHref({ page, q, activity, customer: customer.id })}>
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
        <nav className="flex items-center justify-between rounded-[1.1rem] border border-border/70 bg-white/82 px-3.5 py-3 shadow-[0_12px_28px_-28px_rgba(15,23,42,0.16)] sm:px-4">
          <Link
            href={buildCustomersPageHref({
              page: Math.max(1, page - 1),
              q,
              activity,
            })}
            aria-disabled={page <= 1}
            className={`admin-pagination-button ${
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
            href={buildCustomersPageHref({
              page: Math.min(totalPages, page + 1),
              q,
              activity,
            })}
            aria-disabled={page >= totalPages}
            className={`admin-pagination-button ${
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
