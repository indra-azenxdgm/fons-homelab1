import Link from "next/link";

import type { AdminOverview } from "@/features/admin/api/dashboard-api";
import { AdminAssignedSquads } from "@/features/admin/components/admin-assigned-squads";
import { BookingStatusBadge } from "@/features/admin/components/booking-status-badge";
import { AdminOverviewBookingCalHeatmap } from "@/features/admin/components/admin-overview-booking-cal-heatmap";
import {
  formatAdminDate,
  getTimeSlotLabel,
} from "@/features/admin/lib/server/admin-service";

type DashboardOverviewProps = {
  overview: AdminOverview;
};

function formatDateTime(date: Date, timeSlot: string) {
  return `${formatAdminDate(date)} at ${getTimeSlotLabel(timeSlot)}`;
}

function formatStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function getBookingsIndicator(overview: AdminOverview) {
  const ratio = overview.summary.totalBookings
    ? Math.round((overview.summary.activeBookings / overview.summary.totalBookings) * 100)
    : 0;

  return {
    value: `${ratio}% aktif`,
    tone:
      ratio >= 70
        ? "border-emerald-200/80 bg-emerald-50 text-emerald-700"
        : ratio >= 40
          ? "border-sky-200/80 bg-sky-50 text-sky-700"
          : "border-amber-200/80 bg-amber-50 text-amber-700",
  };
}

function getCustomersIndicator(overview: AdminOverview) {
  const averageBookingsPerCustomer = overview.summary.totalCustomers
    ? overview.summary.totalBookings / overview.summary.totalCustomers
    : 0;

  return {
    value: `${averageBookingsPerCustomer.toFixed(1)}x / customer`,
    tone: "border-[#D6E6F7] bg-[#F7FBFF] text-[#28527A]",
  };
}

function buildSparklinePath(points: number[], width: number, height: number) {
  if (!points.length) {
    return "";
  }

  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);

  return points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
      const y = height - ((point - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildSparklineArea(points: number[], width: number, height: number) {
  const path = buildSparklinePath(points, width, height);

  if (!path) {
    return "";
  }

  return `${path} L ${width} ${height} L 0 ${height} Z`;
}

function AdminDashboardSparkline({
  series,
  stroke,
  fill,
}: {
  series: Array<{ label: string; count: number }>;
  stroke: string;
  fill: string;
}) {
  const width = 220;
  const height = 52;
  const points = series.map((item) => item.count);
  const linePath = buildSparklinePath(points, width, height - 6);
  const areaPath = buildSparklineArea(points, width, height - 6);

  return (
    <div className="relative mt-4 rounded-[1rem] border border-border/60 bg-[linear-gradient(180deg,rgba(247,251,255,0.9)_0%,rgba(255,255,255,0.88)_100%)] px-3 py-2.5">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[52px] w-full overflow-visible" aria-hidden="true">
        <path d={areaPath} fill={fill} />
        <path
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-muted-foreground">
        <span>{series[0]?.label || "-"}</span>
        <span>Last 7 days</span>
        <span>{series.at(-1)?.label || "-"}</span>
      </div>
    </div>
  );
}

function DashboardKpiCard({
  label,
  value,
  indicator,
  series,
  stroke,
  fill,
}: {
  label: string;
  value: number;
  indicator: {
    value: string;
    tone: string;
  };
  series: Array<{ date: string; label: string; count: number }>;
  stroke: string;
  fill: string;
}) {
  return (
    <div className="min-w-0 rounded-[1.3rem] border border-border/70 bg-white/82 px-4 py-4 lg:px-5 lg:py-4.5">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <p className="admin-kicker-label">{label}</p>
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.02em] ${indicator.tone}`}
        >
          {indicator.value}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-[2rem] font-semibold leading-none tracking-[-0.05em] text-foreground lg:text-[2.15rem]">
          {value}
        </p>
        <p className="text-[11px] leading-4 text-muted-foreground">
          Recent trend
        </p>
      </div>
      <AdminDashboardSparkline series={series} stroke={stroke} fill={fill} />
    </div>
  );
}

export function AdminDashboardOverview({
  overview,
}: DashboardOverviewProps) {
  const operationsPreviewCount = 3;
  const recordsPreviewCount = 5;
  const highlightStatuses = overview.statusCounts.filter((item) =>
    ["PENDING", "CONFIRMED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "PAID", "CANCELLED"].includes(item.status),
  );
  const bookingsIndicator = getBookingsIndicator(overview);
  const customersIndicator = getCustomersIndicator(overview);
  const latestNotifications = overview.notificationSummary.latestItems.slice(0, 4);
  const todaysBookingsPreview = overview.todaysBookings.slice(0, operationsPreviewCount);
  const upcomingBookingsPreview = overview.upcomingBookings.slice(0, operationsPreviewCount);
  const recentBookingsPreview = overview.recentBookings.slice(0, recordsPreviewCount);
  const recentCustomersPreview = overview.recentCustomers.slice(0, recordsPreviewCount);

  return (
    <section className="min-w-0 max-w-full space-y-3.5 sm:space-y-4.5">
      <section className="panel min-w-0 max-w-full overflow-hidden p-3.5 sm:p-4.5">
        <div className="mb-3 flex min-w-0 flex-col gap-1.5 sm:mb-4">
          <p className="section-kicker">Executive summary</p>
          <p className="admin-section-copy">Live operational health across bookings, customers, and status mix.</p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,248px)_minmax(0,248px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,270px)_minmax(0,270px)_minmax(0,1fr)] xl:items-stretch xl:gap-3.5">
          <DashboardKpiCard
            label="Total bookings"
            value={overview.summary.totalBookings}
            indicator={bookingsIndicator}
            series={overview.summary.bookingTrend}
            stroke="#1B75BE"
            fill="rgba(27,117,190,0.14)"
          />

          <DashboardKpiCard
            label="Total customers"
            value={overview.summary.totalCustomers}
            indicator={customersIndicator}
            series={overview.summary.customerTrend}
            stroke="#2C7A64"
            fill="rgba(44,122,100,0.14)"
          />

          <div className="min-w-0 rounded-[1.3rem] border border-border/70 bg-white/76 px-3 py-3 sm:px-4 lg:px-5 lg:py-3.5 xl:min-h-[214px]">
            <div className="grid min-w-0 grid-cols-2 gap-2 lg:h-full xl:grid-cols-3 2xl:grid-cols-6">
              {highlightStatuses.map((item) => (
                <div
                  key={item.status}
                  className="min-w-0 rounded-[0.95rem] border border-border/60 bg-muted/20 px-2.5 py-2.5 lg:px-3 lg:py-3"
                >
                  <p className="break-words text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {formatStatusLabel(item.status)}
                  </p>
                  <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-1.5">
                    <p className="text-lg font-semibold leading-none tracking-[-0.03em] text-foreground lg:text-[1.3rem]">
                      {item.count}
                    </p>
                    <BookingStatusBadge status={item.status} size="compact" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-3.5 xl:grid-cols-[minmax(0,1.14fr)_minmax(420px,0.86fr)] xl:items-stretch">
        <section className="panel flex h-full min-w-0 max-w-full flex-col overflow-hidden p-4 sm:p-4.5 xl:min-h-[33.5rem]">
          <div className="min-w-0">
            <p className="admin-section-title">
              Booking activity heatmap
            </p>
            <p className="admin-section-copy">
              Pattern of booking volume by weekday and slot within the current window.
            </p>
          </div>

          <div className="mt-3">
            <AdminOverviewBookingCalHeatmap heatmap={overview.heatmap} />
          </div>
        </section>

        <section className="panel flex h-full min-w-0 max-w-full flex-col overflow-hidden p-4 sm:p-4.5 xl:min-h-[33.5rem]">
          <div className="min-w-0">
            <p className="admin-section-title">
              Notification summary
            </p>
            <p className="admin-section-copy">
              Quick operational signal from your notification center.
            </p>
          </div>

          <div className="mt-3.5 flex-1">
            <div className="flex h-full min-w-0 flex-col rounded-[1.35rem] border border-border/70 bg-white/72 p-3 sm:p-3.5">
              <div className="grid min-w-0 grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:gap-2.5">
                <div className="min-w-0 rounded-[1rem] border border-border/60 bg-muted/20 px-3 py-2.5">
                  <p className="admin-kicker-label">Unread</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    {overview.notificationSummary.unreadCount}
                  </p>
                </div>
                <div className="min-w-0 rounded-[1rem] border border-border/60 bg-muted/20 px-3 py-2.5">
                  <p className="admin-kicker-label">New bookings</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    {overview.notificationSummary.todaysNewBookings}
                  </p>
                </div>
                <div className="min-w-0 rounded-[1rem] border border-border/60 bg-muted/20 px-3 py-2.5">
                  <p className="admin-kicker-label">Status updates</p>
                  <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-foreground">
                    {overview.notificationSummary.todaysStatusUpdates}
                  </p>
                </div>
                <div className="min-w-0 rounded-[1rem] border border-border/60 bg-muted/20 px-3 py-2.5">
                  <p className="admin-kicker-label">Squad updates</p>
                  <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-foreground">
                    {overview.notificationSummary.todaysSquadUpdates}
                  </p>
                </div>
                <div className="col-span-full min-w-0 rounded-[1rem] border border-amber-200 bg-amber-50/70 px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-amber-700">
                    Attention alerts
                  </p>
                  <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-amber-800">
                    {overview.notificationSummary.attentionAlertsOpen}
                  </p>
                </div>
              </div>

              <div className="mt-3.5 flex-1">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                  <p className="text-[12px] font-semibold leading-5 text-foreground">
                    Latest alerts
                  </p>
                  <Link
                    href="/admin/notifications"
                    className="text-[11px] font-medium leading-4 text-primary transition hover:text-primary/80"
                  >
                    Open notifications
                  </Link>
                </div>

                <div className="mt-2.5 space-y-2">
                  {latestNotifications.length ? (
                    latestNotifications.map((notification) => (
                      <Link
                        key={notification.id}
                        href={notification.href || "/admin/notifications"}
                        className={`block rounded-[1.1rem] px-3 py-2 transition hover:bg-muted/65 ${
                          notification.severity === "critical"
                            ? "border border-rose-200 bg-rose-50/70"
                            : notification.severity === "warning"
                              ? "border border-amber-200 bg-amber-50/70"
                              : "bg-muted/45"
                        }`}
                      >
                        <p className="break-words text-[12px] font-semibold leading-4.5 text-foreground">
                          {notification.title}
                        </p>
                        <p className="mt-0.5 break-words text-[11px] leading-4 text-muted-foreground">
                          {notification.message}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <p className="text-[12px] leading-5 text-muted-foreground">
                      No recent notifications for your account.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid min-w-0 gap-3.5 lg:grid-cols-2 lg:items-stretch">
        <section className="panel flex h-full min-w-0 max-w-full flex-col overflow-hidden p-4 sm:p-4.5 lg:min-h-[21.5rem]">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-5 text-foreground">
                Today&apos;s bookings
              </p>
              <p className="text-[11px] leading-4 text-muted-foreground">
                Scheduled for the current booking date
              </p>
            </div>
            <p className="text-2xl font-semibold tracking-[-0.03em]">
              {overview.todaysBookings.length}
            </p>
          </div>

          <div className="mt-3 flex-1 space-y-2">
            {todaysBookingsPreview.length ? (
              todaysBookingsPreview.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/admin/bookings/${booking.id}`}
                  className="block rounded-[1.1rem] bg-muted/45 px-3 py-2 transition hover:bg-muted/65"
                >
                  <div className="flex min-w-0 items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate pr-1 text-[12px] font-semibold leading-5 text-foreground">
                        {booking.contactName}
                      </p>
                      <p className="break-words text-[11px] leading-4 text-muted-foreground">
                        {getTimeSlotLabel(booking.timeSlot)} | {booking.serviceType.name}
                      </p>
                    </div>
                    <div className="shrink-0 self-start">
                      <BookingStatusBadge status={booking.status} />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-[12px] leading-5 text-muted-foreground">
                No bookings scheduled for today.
              </p>
            )}
          </div>
        </section>

        <section className="panel flex h-full min-w-0 max-w-full flex-col overflow-hidden p-4 sm:p-4.5 lg:min-h-[21.5rem]">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-5 text-foreground">
                Upcoming bookings
              </p>
              <p className="text-[11px] leading-4 text-muted-foreground">
                Next bookings from today onward
              </p>
            </div>
            <p className="text-2xl font-semibold tracking-[-0.03em]">
              {overview.upcomingBookings.length}
            </p>
          </div>

          <div className="mt-3 flex-1 space-y-2">
            {upcomingBookingsPreview.length ? (
              upcomingBookingsPreview.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/admin/bookings/${booking.id}`}
                  className="block rounded-[1.1rem] bg-muted/45 px-3 py-2 transition hover:bg-muted/65"
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-start justify-between gap-2.5">
                      <p className="truncate pr-1 text-[12px] font-semibold leading-5 text-foreground">
                        {booking.bookingCode}
                      </p>
                      <div className="shrink-0 self-start">
                        <BookingStatusBadge status={booking.status} />
                      </div>
                    </div>
                    <p className="mt-0.5 break-words text-[11px] leading-4 text-muted-foreground">
                      {formatDateTime(booking.bookingDate, booking.timeSlot)}
                    </p>
                    <p className="mt-0.5 break-words text-[11px] leading-4 text-muted-foreground">
                      {booking.contactName} | {booking.serviceType.name}
                    </p>
                    <div className="mt-1 min-w-0 max-w-full">
                      <AdminAssignedSquads squads={booking.assignedSquads} variant="compact" />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-[12px] leading-5 text-muted-foreground">
                No upcoming bookings found.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="grid min-w-0 gap-3.5 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] xl:items-stretch">
        <section className="panel flex h-full min-w-0 flex-col overflow-hidden xl:min-h-[25rem]">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3.5 sm:px-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-4 tracking-tight sm:text-base">
                Recent bookings
              </p>
              <p className="text-[12px] leading-5 text-muted-foreground">
                Most recently created booking requests.
              </p>
            </div>
            <Link
              href="/admin/bookings"
              className="text-[11px] font-medium leading-4 text-primary transition hover:text-primary/80 sm:text-[12px]"
            >
              Open all
            </Link>
          </div>

          <div className="flex-1 divide-y divide-border/70">
            {recentBookingsPreview.length ? (
              recentBookingsPreview.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/admin/bookings/${booking.id}`}
                  className="flex min-w-0 flex-col gap-1.5 px-4 py-2.5 transition hover:bg-muted/25 sm:flex-row sm:items-start sm:justify-between sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <p className="break-words pr-2 text-[12px] font-semibold leading-5 text-foreground">
                        {booking.bookingCode} | {booking.contactName}
                      </p>
                      <div className="shrink-0 min-[420px]:hidden">
                        <BookingStatusBadge status={booking.status} size="compact" />
                      </div>
                    </div>
                    <p className="mt-0.5 break-words text-[11px] leading-4 text-muted-foreground">
                      {booking.serviceType.name} | {formatDateTime(booking.bookingDate, booking.timeSlot)}
                    </p>
                  </div>
                  <div className="hidden shrink-0 min-[420px]:block">
                    <BookingStatusBadge status={booking.status} />
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-4 py-5 text-[12px] leading-5 text-muted-foreground sm:px-5">
                No recent bookings yet.
              </div>
            )}
          </div>
        </section>

        <section className="panel flex h-full min-w-0 flex-col overflow-hidden xl:min-h-[25rem]">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3.5 sm:px-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-4 tracking-tight sm:text-base">
                Recent customers
              </p>
              <p className="text-[12px] leading-5 text-muted-foreground">
                Latest customer records with booking context.
              </p>
            </div>
            <Link
              href="/admin/customers"
              className="text-[11px] font-medium leading-4 text-primary transition hover:text-primary/80 sm:text-[12px]"
            >
              Open all
            </Link>
          </div>

          <div className="flex-1 divide-y divide-border/70">
            {recentCustomersPreview.length ? (
              recentCustomersPreview.map((customer) => {
                const latestBooking = customer.bookings[0];

                return (
                  <Link
                    key={customer.id}
                    href={`/admin/customers/${customer.id}`}
                    className="block px-4 py-2.5 transition hover:bg-muted/25 sm:px-5"
                  >
                    <div className="flex min-w-0 flex-col gap-1.5 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
                      <div className="min-w-0 max-w-full">
                        <p className="truncate text-[12px] font-semibold leading-5 text-foreground">
                          {customer.fullName}
                        </p>
                        <p className="break-words text-[12px] leading-5 text-muted-foreground">
                          {customer.phone}
                          {customer.email ? ` | ${customer.email}` : ""}
                        </p>
                        <p className="mt-0.5 break-words text-[11px] leading-4 text-muted-foreground">
                          {customer._count.bookings} bookings
                          {latestBooking
                            ? ` | Last booking ${formatAdminDate(latestBooking.bookingDate)}`
                            : " | No bookings yet"}
                        </p>
                      </div>
                      <div className="shrink-0 self-start min-[420px]:self-center">
                        {latestBooking ? (
                          <BookingStatusBadge status={latestBooking.status} />
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="px-4 py-5 text-[12px] leading-5 text-muted-foreground sm:px-5">
                No customer records yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
