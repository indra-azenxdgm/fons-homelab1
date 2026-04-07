import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  UserRound,
  XCircle,
  Zap,
} from "lucide-react";
import type { BookingStatus } from "@/features/booking/constants";

import { formatAdminStatusLabel } from "@/features/admin/lib/shared/admin-filter-utils";

const legendStyles: Record<BookingStatus, { icon: typeof Clock3; className: string }> = {
  PENDING: {
    icon: Clock3,
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  CONFIRMED: {
    icon: BadgeCheck,
    className: "border-sky-200 bg-sky-50 text-sky-800",
  },
  ASSIGNED: {
    icon: UserRound,
    className: "border-indigo-200 bg-indigo-50 text-indigo-800",
  },
  IN_PROGRESS: {
    icon: Zap,
    className: "border-violet-200 bg-violet-50 text-violet-800",
  },
  COMPLETED: {
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  PAID: {
    icon: CheckCircle2,
    className: "border-teal-200 bg-teal-50 text-teal-800",
  },
  CANCELLED: {
    icon: XCircle,
    className: "border-rose-200 bg-rose-50 text-rose-800",
  },
};

export function AdminCalendarLegend({
  statuses,
}: {
  statuses: BookingStatus[];
}) {
  return (
    <div className="rounded-[1.2rem] border border-border/70 bg-white/86 p-4 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.2)]">
      <p className="admin-kicker-label">
        Status legend
      </p>
      <div className="mt-3 space-y-2.5">
        {statuses.map((status) => {
          const Icon = legendStyles[status].icon;

          return (
            <div key={status} className="flex items-center gap-2 text-[12px] leading-5">
              <span className={`inline-flex size-6 items-center justify-center rounded-full border ${legendStyles[status].className}`}>
                <Icon className="size-3.5" />
              </span>
              <span className="text-foreground">
                {formatAdminStatusLabel(status)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
