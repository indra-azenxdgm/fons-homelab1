import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  ListFilter,
} from "lucide-react";
import { AdminCalendarDayStatusControl } from "@/features/admin/components/admin-calendar-day-status-control";
import { AdminCalendarEventCard } from "@/features/admin/components/admin-calendar-event-card";
import { AdminCalendarFilters } from "@/features/admin/components/admin-calendar-filters";
import { AdminCalendarLegend } from "@/features/admin/components/admin-calendar-legend";
import { AdminCalendarMobileAgendaItem } from "@/features/admin/components/admin-calendar-mobile-agenda-item";
import { AdminCalendarMobileMonthCard } from "@/features/admin/components/admin-calendar-mobile-month-card";
import { AdminCalendarViewSwitcher } from "@/features/admin/components/admin-calendar-view-switcher";
import { getAdminBookingServiceDisplayLabel } from "@/features/admin/lib/shared/admin-booking-service-display";
import {
  bookingStatusOptions,
  getTimeSlotLabel,
} from "@/features/admin/lib/server/admin-service";
import {
  toAdminCalendarView,
  type AdminCalendarView,
} from "@/features/admin/lib/shared/admin-calendar";
import type { BookingDayStatus, BookingStatus, TimeSlot } from "@/features/booking/constants";

type CalendarBooking = {
  id: string;
  bookingCode: string;
  bookingDate: Date;
  timeSlot: TimeSlot;
  status: BookingStatus;
  contactName: string;
  contactPhone: string;
  serviceTypeId: string;
  serviceDisplayName: string | null;
  serviceVariant: string | null;
  serviceIssue: string | null;
  serviceComplaint: string | null;
  serviceType: {
    name: string;
  };
  assignedSquads: Array<{
    id: string;
    name: string;
    alias: string;
  }>;
};

type AdminCalendarMonthProps = {
  monthStart: Date;
  selectedDate: Date;
  selectedDayOverride: {
    date: string;
    status: BookingDayStatus;
    reason: string | null;
    message: string | null;
  };
  dayOverrides: Array<{
    date: string;
    status: BookingDayStatus;
    reason: string | null;
    message: string | null;
  }>;
  bookings: CalendarBooking[];
  serviceTypes: Array<{
    id: string;
    name: string;
  }>;
  squads: Array<{
    id: string;
    name: string;
    alias: string;
  }>;
  appliedFilters: {
    q: string;
    month: string;
    day: string;
    view: string;
    status: string;
    assignedSquadId: string;
    serviceTypeId: string;
  };
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const orderedTimeSlots: TimeSlot[] = [
  "SLOT_0900",
  "SLOT_1100",
  "SLOT_1300",
  "SLOT_1500",
];

const statusColorMap: Record<BookingStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  CONFIRMED: "border-sky-200 bg-sky-50 text-sky-800",
  ASSIGNED: "border-indigo-200 bg-indigo-50 text-indigo-800",
  IN_PROGRESS: "border-violet-200 bg-violet-50 text-violet-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  PAID: "border-teal-200 bg-teal-50 text-teal-800",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
};

const dayStatusBadgeClassNameMap: Record<BookingDayStatus, string> = {
  OPEN: "border-emerald-200 bg-emerald-50 text-emerald-800",
  FULL_BOOKED: "border-amber-200 bg-amber-50 text-amber-800",
  CLOSED: "border-rose-200 bg-rose-50 text-rose-800",
};

function getDayStatusLabel(status: BookingDayStatus) {
  if (status === "CLOSED") {
    return "Closed";
  }

  if (status === "FULL_BOOKED") {
    return "Full booking";
  }

  return "Open";
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatMonthOnlyLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(date);
}

function formatYearLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
  }).format(date);
}

function formatMiniMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatWeekdayShort(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(date);
}

function formatSelectedDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatMonthDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function toMonthInputValue(date: Date) {
  return date.toISOString().slice(0, 7);
}

function toDayInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function addMonths(date: Date, amount: number) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + amount,
    1,
  ));
}

function startOfCalendarGrid(date: Date) {
  const firstOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const day = firstOfMonth.getUTCDay();
  const offset = day === 0 ? 6 : day - 1;
  firstOfMonth.setUTCDate(firstOfMonth.getUTCDate() - offset);
  return firstOfMonth;
}

function startOfWeek(date: Date) {
  const weekStart = new Date(date);
  const day = weekStart.getUTCDay();
  const offset = day === 0 ? 6 : day - 1;
  weekStart.setUTCDate(weekStart.getUTCDate() - offset);
  return weekStart;
}

function isSameDay(left: Date, right: Date) {
  return toDayInputValue(left) === toDayInputValue(right);
}

function buildCalendarHref({
  q,
  month,
  day,
  view,
  status,
  assignedSquadId,
  serviceTypeId,
}: {
  q?: string;
  month: string;
  day?: string;
  view?: AdminCalendarView;
  status?: string;
  assignedSquadId?: string;
  serviceTypeId?: string;
}) {
  const params = new URLSearchParams();
  params.set("month", month);

  if (q) {
    params.set("q", q);
  }

  if (day) {
    params.set("day", day);
  }

  if (view) {
    params.set("view", view);
  }

  if (status) {
    params.set("status", status);
  }

  if (assignedSquadId) {
    params.set("assignedSquadId", assignedSquadId);
  }

  if (serviceTypeId) {
    params.set("serviceTypeId", serviceTypeId);
  }

  return `/admin/calendar?${params.toString()}`;
}

function renderMonthEventChip(booking: CalendarBooking) {
  const serviceLabel = getAdminBookingServiceDisplayLabel(booking);

  return (
    <Link
      key={booking.id}
      href={`/admin/bookings/${booking.id}`}
      className={`block rounded-[0.95rem] border px-2.5 py-2 transition hover:shadow-sm ${statusColorMap[booking.status]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-xs font-semibold">
          {booking.bookingCode}
        </p>
        <span className="inline-flex items-center gap-1 text-[11px]">
          <Clock3 className="size-3" />
          {getTimeSlotLabel(booking.timeSlot)}
        </span>
      </div>
      <p className="mt-1 truncate text-sm font-medium text-foreground">
        {booking.contactName}
      </p>
      <p className="truncate text-xs text-foreground/70" title={serviceLabel}>
        {serviceLabel}
      </p>
    </Link>
  );
}

function getMobileCalendarDotsForDate(bookings: CalendarBooking[]) {
  return [...bookings]
    .sort((left, right) => {
      if (left.timeSlot !== right.timeSlot) {
        return left.timeSlot.localeCompare(right.timeSlot);
      }

      return left.bookingCode.localeCompare(right.bookingCode);
    })
    .slice(0, 9)
    .map((booking) => booking.status);
}

export function AdminCalendarMonth({
  monthStart,
  selectedDate,
  selectedDayOverride,
  dayOverrides,
  bookings,
  serviceTypes,
  squads,
  appliedFilters,
}: AdminCalendarMonthProps) {
  const currentView = toAdminCalendarView(appliedFilters.view);
  const previousMonth = addMonths(monthStart, -1);
  const nextMonth = addMonths(monthStart, 1);
  const gridStart = startOfCalendarGrid(monthStart);
  const dayCells = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const weekStart = startOfWeek(selectedDate);
  const weekDaysRange = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const dayOverridesByDate = new Map(dayOverrides.map((override) => [override.date, override]));

  const bookingsByDay = new Map<string, CalendarBooking[]>();

  bookings.forEach((booking) => {
    const key = toDayInputValue(booking.bookingDate);
    const dayBookings = bookingsByDay.get(key) || [];
    dayBookings.push(booking);
    bookingsByDay.set(key, dayBookings);
  });

  const selectedDayKey = toDayInputValue(selectedDate);
  const selectedDayBookings = bookingsByDay.get(selectedDayKey) || [];
  const mobileCalendarDays = dayCells.map((day) => {
    const dayKey = toDayInputValue(day);

    return {
      key: dayKey,
      label: String(day.getUTCDate()),
      href: buildCalendarHref({
        q: appliedFilters.q,
        month: toMonthInputValue(day),
        day: dayKey,
        view: "day",
        status: appliedFilters.status,
        assignedSquadId: appliedFilters.assignedSquadId,
        serviceTypeId: appliedFilters.serviceTypeId,
      }),
      isCurrentMonth: day.getUTCMonth() === monthStart.getUTCMonth(),
      isSelected: dayKey === selectedDayKey,
      blockedStatus: dayOverridesByDate.get(dayKey)?.status ?? "OPEN",
      dotStatuses: getMobileCalendarDotsForDate(bookingsByDay.get(dayKey) || []),
    };
  });

  const weekBookingsCount = weekDaysRange.reduce(
    (total, date) => total + (bookingsByDay.get(toDayInputValue(date))?.length || 0),
    0,
  );

  let previousRangeDate = selectedDate;
  let nextRangeDate = selectedDate;

  if (currentView === "month") {
    previousRangeDate = new Date(Date.UTC(
      previousMonth.getUTCFullYear(),
      previousMonth.getUTCMonth(),
      1,
    ));
    nextRangeDate = new Date(Date.UTC(
      nextMonth.getUTCFullYear(),
      nextMonth.getUTCMonth(),
      1,
    ));
  } else if (currentView === "week") {
    previousRangeDate = addDays(selectedDate, -7);
    nextRangeDate = addDays(selectedDate, 7);
  } else {
    previousRangeDate = addDays(selectedDate, -1);
    nextRangeDate = addDays(selectedDate, 1);
  }

  const buildViewHref = (view: AdminCalendarView) =>
    buildCalendarHref({
      q: appliedFilters.q,
      month: appliedFilters.month,
      day: appliedFilters.day,
      view,
      status: appliedFilters.status,
      assignedSquadId: appliedFilters.assignedSquadId,
      serviceTypeId: appliedFilters.serviceTypeId,
    });

  const previousHref = buildCalendarHref({
    q: appliedFilters.q,
    month: toMonthInputValue(previousRangeDate),
    day: toDayInputValue(previousRangeDate),
    view: currentView,
    status: appliedFilters.status,
    assignedSquadId: appliedFilters.assignedSquadId,
    serviceTypeId: appliedFilters.serviceTypeId,
  });

  const nextHref = buildCalendarHref({
    q: appliedFilters.q,
    month: toMonthInputValue(nextRangeDate),
    day: toDayInputValue(nextRangeDate),
    view: currentView,
    status: appliedFilters.status,
    assignedSquadId: appliedFilters.assignedSquadId,
    serviceTypeId: appliedFilters.serviceTypeId,
  });

  const workspaceTitle =
    currentView === "day"
      ? formatSelectedDateLabel(selectedDate)
      : currentView === "week"
        ? `${formatMonthDayLabel(weekDaysRange[0])} - ${formatMonthDayLabel(weekDaysRange[6])}`
        : formatMonthLabel(monthStart);

  const workspaceSubtitle =
    currentView === "day"
      ? `${selectedDayBookings.length} booking${selectedDayBookings.length === 1 ? "" : "s"} scheduled for this date`
      : currentView === "week"
        ? `${weekBookingsCount} booking${weekBookingsCount === 1 ? "" : "s"} across this week`
        : `${bookings.length} booking${bookings.length === 1 ? "" : "s"} scheduled in this calendar window`;

  return (
    <section className="space-y-5">
      <AdminCalendarFilters
        q={appliedFilters.q}
        status={appliedFilters.status}
        assignedSquadId={appliedFilters.assignedSquadId}
        serviceTypeId={appliedFilters.serviceTypeId}
        statusOptions={bookingStatusOptions}
        squads={squads}
        serviceTypes={serviceTypes}
      />

      <div className="space-y-3 md:hidden">
        <AdminCalendarMobileMonthCard
          monthLabel={formatMonthOnlyLabel(monthStart)}
          yearLabel={formatYearLabel(monthStart)}
          weekdayLabels={weekDays}
          previousHref={buildCalendarHref({
            q: appliedFilters.q,
            month: toMonthInputValue(previousMonth),
            day: `${toMonthInputValue(previousMonth)}-${String(
              Math.min(selectedDate.getUTCDate(), new Date(Date.UTC(previousMonth.getUTCFullYear(), previousMonth.getUTCMonth() + 1, 0)).getUTCDate()),
            ).padStart(2, "0")}`,
            view: "month",
            status: appliedFilters.status,
            assignedSquadId: appliedFilters.assignedSquadId,
            serviceTypeId: appliedFilters.serviceTypeId,
          })}
          nextHref={buildCalendarHref({
            q: appliedFilters.q,
            month: toMonthInputValue(nextMonth),
            day: `${toMonthInputValue(nextMonth)}-${String(
              Math.min(selectedDate.getUTCDate(), new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 0)).getUTCDate()),
            ).padStart(2, "0")}`,
            view: "month",
            status: appliedFilters.status,
            assignedSquadId: appliedFilters.assignedSquadId,
            serviceTypeId: appliedFilters.serviceTypeId,
          })}
          days={mobileCalendarDays}
        />

        <div className="flex justify-center">
          <span className="h-1.5 w-14 rounded-full bg-border/80" />
        </div>

        <section className="rounded-[1.35rem] border border-border/70 bg-white/92 p-4 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="admin-section-title">
                Events for {formatSelectedDateLabel(selectedDate)}
              </p>
              <p className="admin-meta-text mt-1">
                {selectedDayBookings.length} booking{selectedDayBookings.length === 1 ? "" : "s"} scheduled
              </p>
            </div>
            <AdminCalendarDayStatusControl
              date={selectedDayOverride.date}
              currentStatus={selectedDayOverride.status}
              currentReason={selectedDayOverride.reason}
              compact
            />
          </div>

          {selectedDayOverride.status !== "OPEN" ? (
            <div className={`mt-3 rounded-[1rem] border px-4 py-3 text-[12px] leading-5 ${dayStatusBadgeClassNameMap[selectedDayOverride.status]}`}>
              <p className="font-semibold">{getDayStatusLabel(selectedDayOverride.status)}</p>
              <p className="mt-1">{selectedDayOverride.message}</p>
            </div>
          ) : null}

          <div className="mt-3 space-y-2.5">
            {selectedDayBookings.length ? (
              selectedDayBookings.map((booking) => (
                <AdminCalendarMobileAgendaItem
                  key={booking.id}
                  booking={booking}
                />
              ))
            ) : (
              <div className="rounded-[1.1rem] border border-dashed border-border/70 bg-muted/18 px-4 py-5 text-center">
                <p className="admin-card-title">
                  No bookings scheduled
                </p>
                <p className="admin-meta-text mt-1">
                  Try another date in this month or adjust the current filters.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="hidden space-y-5 md:block">
        <div className="flex flex-col gap-4 rounded-[1.5rem] border border-border/70 bg-white/86 p-5 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.2)] lg:flex-row lg:items-center lg:justify-between">
          <div>
              <p className="admin-section-title">
                Service calendar
              </p>
              <p className="admin-section-copy mt-1">
                Switch between focused day planning, weekly workload review, and the full month grid without leaving the current filtered context.
              </p>
          </div>

          <AdminCalendarViewSwitcher
            activeView={currentView}
            buildHref={buildViewHref}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[292px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-[1.2rem] border border-border/70 bg-white p-4 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.2)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="admin-card-title">
                      {formatMiniMonthLabel(monthStart)}
                    </p>
                    <p className="admin-meta-text">
                      Monthly operations focus
                    </p>
                </div>
                <ListFilter className="size-4 text-muted-foreground" />
              </div>

              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
                {weekDays.map((day) => (
                  <span key={day}>{day.slice(0, 1)}</span>
                ))}
                {dayCells.slice(0, 35).map((day) => {
                  const dayOverride = dayOverridesByDate.get(toDayInputValue(day));
                  const isCurrentMonth = day.getUTCMonth() === monthStart.getUTCMonth();
                  const isSelected = isSameDay(day, selectedDate);

                  return (
                    <Link
                      key={`mini-${day.toISOString()}`}
                      href={buildCalendarHref({
                        q: appliedFilters.q,
                        month: toMonthInputValue(day),
                        day: toDayInputValue(day),
                        view: "day",
                        status: appliedFilters.status,
                        assignedSquadId: appliedFilters.assignedSquadId,
                        serviceTypeId: appliedFilters.serviceTypeId,
                      })}
                      className={`inline-flex size-7 items-center justify-center rounded-full text-[11px] transition ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : isCurrentMonth
                            ? dayOverride && dayOverride.status !== "OPEN"
                              ? "border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                              : "bg-muted/45 text-foreground hover:bg-muted/70"
                            : "text-muted-foreground/40"
                      }`}
                    >
                      {day.getUTCDate()}
                    </Link>
                  );
                })}
              </div>
            </div>

            <AdminCalendarLegend statuses={bookingStatusOptions} />
          </aside>

          <div className="overflow-hidden rounded-[1.45rem] border border-border/70 bg-white/92 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.2)]">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
              <div>
                  <p className="admin-page-title text-[1.1rem] sm:text-[1.25rem] xl:text-[1.35rem]">
                    {workspaceTitle}
                  </p>
                  <p className="admin-section-copy">
                    {workspaceSubtitle}
                  </p>
              </div>

              <div className="flex items-center gap-2">
                {currentView === "day" ? (
                  <AdminCalendarDayStatusControl
                    date={selectedDayOverride.date}
                    currentStatus={selectedDayOverride.status}
                    currentReason={selectedDayOverride.reason}
                  />
                ) : null}
                <Link
                  href={previousHref}
                  className="inline-flex size-10 items-center justify-center rounded-[0.95rem] border border-border bg-background transition hover:bg-muted"
                  aria-label="Previous range"
                >
                  <ArrowLeft className="size-4" />
                </Link>
                <Link
                  href={nextHref}
                  className="inline-flex size-10 items-center justify-center rounded-[0.95rem] border border-border bg-background transition hover:bg-muted"
                  aria-label="Next range"
                >
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {currentView === "day" ? (
              <div className="space-y-3 px-5 py-5">
                {selectedDayOverride.status !== "OPEN" ? (
                  <section className={`rounded-[1.2rem] border px-4 py-4 ${dayStatusBadgeClassNameMap[selectedDayOverride.status]}`}>
                    <p className="text-[13px] font-semibold leading-5">{getDayStatusLabel(selectedDayOverride.status)}</p>
                    <p className="mt-1 text-[12px] leading-5">{selectedDayOverride.message}</p>
                  </section>
                ) : null}
                {orderedTimeSlots.map((slot) => {
                  const slotBookings = selectedDayBookings.filter((booking) => booking.timeSlot === slot);

                  return (
                    <section
                      key={slot}
                      className="rounded-[1.2rem] border border-border/70 bg-muted/18 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="admin-card-title">
                              {getTimeSlotLabel(slot)}
                            </p>
                            <p className="admin-meta-text">
                              {slotBookings.length} booking{slotBookings.length === 1 ? "" : "s"}
                            </p>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2.5">
                        {slotBookings.length ? (
                          slotBookings.map((booking) => (
                            <AdminCalendarEventCard
                              key={booking.id}
                              booking={booking}
                            />
                          ))
                        ) : (
                          <div className="rounded-[1rem] border border-dashed border-border/70 bg-white/80 px-4 py-4 text-[12px] leading-5 text-muted-foreground">
                            No bookings scheduled in this time slot.
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : null}

            {currentView === "week" ? (
              <div className="grid gap-3 px-5 py-5 lg:grid-cols-2 2xl:grid-cols-7">
                {weekDaysRange.map((day) => {
                  const dayBookings = bookingsByDay.get(toDayInputValue(day)) || [];

                  return (
                    <section
                      key={day.toISOString()}
                      className="rounded-[1.15rem] border border-border/70 bg-muted/18 p-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="admin-kicker-label">
                              {formatWeekdayShort(day)}
                            </p>
                            <p className="mt-1 text-sm font-semibold leading-4 text-foreground">
                              {formatMonthDayLabel(day)}
                            </p>
                        </div>
                        {isSameDay(day, selectedDate) ? (
                          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                            Selected
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 space-y-2">
                        {dayBookings.length ? (
                          dayBookings.map((booking) => renderMonthEventChip(booking))
                        ) : (
                          <div className="rounded-[0.95rem] border border-dashed border-border/70 bg-white/80 px-3 py-3 text-[11px] leading-4 text-muted-foreground">
                            No bookings
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : null}

            {currentView === "month" ? (
              <>
                <div className="grid grid-cols-7 border-b border-border/70 bg-muted/30">
                  {weekDays.map((day) => (
                      <div key={day} className="admin-kicker-label px-3 py-3 text-center">
                        {day}
                      </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {dayCells.map((day) => {
                    const dayKey = toDayInputValue(day);
                    const dayBookings = bookingsByDay.get(dayKey) || [];
                    const dayOverride = dayOverridesByDate.get(dayKey);
                    const isCurrentMonth = day.getUTCMonth() === monthStart.getUTCMonth();
                    const isToday =
                      dayKey === new Date().toISOString().slice(0, 10);
                    const isSelected = dayKey === selectedDayKey;

                    return (
                      <div
                        key={dayKey}
                        className={`min-h-[10rem] border-b border-r border-border/60 px-3 py-3 ${
                          isCurrentMonth ? "bg-white" : "bg-muted/18"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <Link
                            href={buildCalendarHref({
                              q: appliedFilters.q,
                              month: toMonthInputValue(day),
                              day: dayKey,
                              view: "day",
                              status: appliedFilters.status,
                              assignedSquadId: appliedFilters.assignedSquadId,
                              serviceTypeId: appliedFilters.serviceTypeId,
                            })}
                            className={`inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : isCurrentMonth
                                  ? "text-foreground hover:bg-muted"
                                  : "text-muted-foreground/55"
                            }`}
                          >
                            {day.getUTCDate()}
                          </Link>
                          {isToday ? (
                            <span className="inline-flex size-6 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                              T
                            </span>
                          ) : null}
                        </div>

                        {dayOverride && dayOverride.status !== "OPEN" ? (
                          <div className={`mb-2 rounded-full border px-2 py-1 text-[10px] font-semibold leading-none ${dayStatusBadgeClassNameMap[dayOverride.status]}`}>
                            {getDayStatusLabel(dayOverride.status)}
                          </div>
                        ) : null}

                        <div className="space-y-2">
                          {dayBookings.slice(0, 3).map((booking) => renderMonthEventChip(booking))}

                          {dayBookings.length > 3 ? (
                            <div className="rounded-[0.85rem] bg-muted/40 px-2.5 py-2 text-xs font-medium text-muted-foreground">
                              +{dayBookings.length - 3} more bookings
                            </div>
                          ) : null}

                          {!dayBookings.length && isCurrentMonth ? (
                            <div className="rounded-[0.85rem] border border-dashed border-border/70 px-2.5 py-2 text-[11px] leading-4 text-muted-foreground">
                              No bookings
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}

            <div className="admin-section-copy border-t border-border/70 bg-muted/18 px-5 py-4">
              {currentView === "month"
                ? "Month view shows the wider calendar window. Day and week views keep the same filters and selected date context."
                : currentView === "week"
                  ? "Week view groups bookings by day while preserving the same search and filter state."
                  : "Day view groups bookings by time slot for the selected date."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
