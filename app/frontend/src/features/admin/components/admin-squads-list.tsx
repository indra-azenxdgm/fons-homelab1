import Link from "next/link";

import {
  AdminTableOpenLink,
  adminTableActionsCellClassName,
  adminTableActionsHeaderClassName,
} from "@/features/admin/components/admin-table-actions";
import { AdminSquadMobileCard } from "@/features/admin/components/admin-squad-mobile-card";
import { formatAdminDate, getTimeSlotLabel } from "@/features/admin/lib/server/admin-service";

type AdminSquadsListProps = {
  squads: Array<{
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
      id: string;
      bookingCode: string;
      bookingDate: Date;
      timeSlot: string;
      contactName: string;
      serviceType: {
        name: string;
      };
    }>;
  }>;
  page: number;
  totalPages: number;
  q?: string;
  status?: string;
};

function buildSquadsPageHref({
  page,
  q,
  status,
  squad,
}: {
  page: number;
  q?: string;
  status?: string;
  squad?: string;
}) {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (status) {
    params.set("status", status);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  if (squad) {
    params.set("squad", squad);
  }

  const query = params.toString();

  return query ? `/admin/squads?${query}` : "/admin/squads";
}

export function AdminSquadsList({
  squads,
  page,
  totalPages,
  q,
  status,
}: AdminSquadsListProps) {
  if (squads.length === 0) {
    return (
      <section className="rounded-[1.6rem] border border-dashed border-border/80 bg-white/80 p-8 text-center">
        <p className="admin-empty-title">No squads found</p>
        <p className="admin-empty-copy mt-2">
          Search by squad name, alias, or contact details to find an assignable squad member.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="grid gap-2.5 lg:hidden">
        {squads.map((squad) => (
          <AdminSquadMobileCard
            key={squad.id}
            squad={squad}
            openHref={buildSquadsPageHref({ page, q, status, squad: squad.id })}
          />
        ))}
      </section>

      <section className="hidden overflow-hidden rounded-[1.6rem] border border-border/70 bg-white/94 shadow-[0_20px_44px_-36px_rgba(15,23,42,0.2)] lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-[11px] leading-4">
            <thead className="bg-muted/45 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 leading-4 font-medium">Squad</th>
                <th className="px-3 py-2 leading-4 font-medium">Alias</th>
                <th className="px-3 py-2 leading-4 font-medium">Contact</th>
                <th className="px-3 py-2 leading-4 font-medium">Status</th>
                <th className="px-3 py-2 leading-4 font-medium">Bookings</th>
                <th className="px-3 py-2 leading-4 font-medium">Next assignment</th>
                <th className={adminTableActionsHeaderClassName}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {squads.map((squad) => {
                const nextAssignment = squad.bookings[0];

                return (
                  <tr key={squad.id} className="border-t border-border/70 hover:bg-muted/30">
                    <td className="px-3 py-2 font-semibold">{squad.name}</td>
                    <td className="px-3 py-2">{squad.alias}</td>
                    <td className="px-3 py-2">
                      <div>{squad.phone || "No phone"}</div>
                      <div className="text-[10px] text-muted-foreground">{squad.email || "No email"}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium ${
                        squad.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}>
                        {squad.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2">{squad._count.bookings}</td>
                    <td className="px-3 py-2">
                      {nextAssignment ? (
                        <>
                          {formatAdminDate(nextAssignment.bookingDate)}
                          <div className="text-[10px] text-muted-foreground">
                            {getTimeSlotLabel(nextAssignment.timeSlot)} | {nextAssignment.contactName}
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">No upcoming assignments</span>
                      )}
                    </td>
                    <td className={adminTableActionsCellClassName}>
                      <AdminTableOpenLink href={buildSquadsPageHref({ page, q, status, squad: squad.id })}>
                        Open
                      </AdminTableOpenLink>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {totalPages > 1 ? (
        <nav className="flex items-center justify-between rounded-[1.1rem] border border-border/70 bg-white/82 px-3.5 py-3 shadow-[0_12px_28px_-28px_rgba(15,23,42,0.16)] sm:px-4">
          <Link
            href={buildSquadsPageHref({
              page: Math.max(1, page - 1),
              q,
              status,
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
            href={buildSquadsPageHref({
              page: Math.min(totalPages, page + 1),
              q,
              status,
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
