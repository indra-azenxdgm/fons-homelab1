import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { BookingDayStatus, BookingStatus } from "@/features/booking/constants";

const statusDotMap: Record<BookingStatus, string> = {
  PENDING: "bg-amber-500",
  CONFIRMED: "bg-sky-500",
  ASSIGNED: "bg-indigo-500",
  IN_PROGRESS: "bg-violet-500",
  COMPLETED: "bg-emerald-500",
  PAID: "bg-teal-500",
  CANCELLED: "bg-rose-500",
};

type MobileCalendarDay = {
  key: string;
  label: string;
  href: string;
  isCurrentMonth: boolean;
  isSelected: boolean;
  blockedStatus: BookingDayStatus;
  dotStatuses: BookingStatus[];
};

type AdminCalendarMobileMonthCardProps = {
  monthLabel: string;
  yearLabel: string;
  weekdayLabels: string[];
  previousHref: string;
  nextHref: string;
  days: MobileCalendarDay[];
};

export function AdminCalendarMobileMonthCard({
  monthLabel,
  yearLabel,
  weekdayLabels,
  previousHref,
  nextHref,
  days,
}: AdminCalendarMobileMonthCardProps) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-white/96 p-4 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={previousHref}
          className="inline-flex size-9 items-center justify-center rounded-full border border-border/70 bg-background text-foreground transition hover:bg-muted"
          aria-label="Previous month"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="text-center">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            {monthLabel}
          </p>
          <p className="admin-kicker-label">
            {yearLabel}
          </p>
        </div>

        <Link
          href={nextHref}
          className="inline-flex size-9 items-center justify-center rounded-full border border-border/70 bg-background text-foreground transition hover:bg-muted"
          aria-label="Next month"
        >
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-2 text-center">
        {weekdayLabels.map((label) => (
            <span
              key={label}
              className="admin-kicker-label"
            >
              {label}
            </span>
        ))}

        {days.map((day) => {
          return (
            <Link
              key={day.key}
              href={day.href}
              className="flex min-h-[3.5rem] flex-col items-center justify-start rounded-[1rem] px-1 py-1.5 transition hover:bg-muted/35"
            >
              <span
                className={`inline-flex size-8 items-center justify-center rounded-full text-[12px] font-medium leading-5 ${
                  day.isSelected
                    ? "bg-foreground text-background"
                    : day.isCurrentMonth
                      ? day.blockedStatus !== "OPEN"
                        ? "bg-amber-50 text-amber-900"
                        : "text-foreground"
                      : "text-muted-foreground/35"
                }`}
              >
                {day.label}
              </span>
              <span className="mt-1 flex min-h-4 max-w-[1.9rem] flex-wrap items-center justify-center gap-1">
                {day.dotStatuses.map((status, index) => (
                  <span
                    key={`${day.key}-${status}-${index}`}
                    className={`inline-block size-1.5 rounded-full ${statusDotMap[status]}`}
                  />
                ))}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
