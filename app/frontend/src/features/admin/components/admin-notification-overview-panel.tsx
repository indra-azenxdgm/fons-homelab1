"use client";

import Link from "next/link";

import type { AdminNotificationOverviewResponse } from "@/features/admin/lib/shared/admin-notification-types";

type AdminNotificationOverviewPanelProps = {
  overview: AdminNotificationOverviewResponse;
};

function getTypeLabel(type: string | null) {
  if (type === "BOOKING_CREATED") {
    return "New bookings";
  }

  if (type === "BOOKING_STATUS_CHANGED") {
    return "Status updates";
  }

  if (type === "BOOKING_SQUADS_UPDATED") {
    return "Squad assignments";
  }

  if (type === "BOOKING_ATTENTION_REQUIRED") {
    return "Attention alerts";
  }

  return "No dominant type";
}

function getSeverityClasses(severity: "info" | "warning" | "critical") {
  if (severity === "critical") {
    return "border-rose-200 bg-rose-50/80 text-rose-700";
  }

  if (severity === "warning") {
    return "border-amber-200 bg-amber-50/80 text-amber-700";
  }

  return "border-border/70 bg-white text-muted-foreground";
}

export function AdminNotificationOverviewPanel({
  overview,
}: AdminNotificationOverviewPanelProps) {
  const digest = overview.digest.cadence === "weekly"
    ? overview.digest.weekly
    : overview.digest.daily;

  return (
    <section className="panel min-w-0 w-full max-w-full overflow-hidden p-3.5 sm:p-5">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2.5 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="admin-section-title">
            Notification digest
          </p>
          <p className="admin-section-copy">
            Executive summary of current notification flow and operational attention points.
          </p>
        </div>
        <span className="admin-kicker-label w-full max-w-full rounded-full border border-border/70 bg-white px-2.5 py-1 text-center sm:w-auto sm:px-3">
          {digest.periodLabel}
        </span>
      </div>

      <div className="mt-3 grid min-w-0 w-full max-w-full gap-3 sm:mt-4 sm:gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="min-w-0 w-full max-w-full overflow-hidden rounded-[1.2rem] border border-border/70 bg-white/70 p-3 sm:p-4">
          <div className="grid min-w-0 w-full max-w-full grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:gap-3 md:grid-cols-3">
            <div className="min-w-0 w-full rounded-[1rem] border border-border/60 bg-muted/20 px-2.5 py-2 sm:px-3 sm:py-3">
              <p className="admin-kicker-label">Unread</p>
              <p className="mt-0.5 text-[1.15rem] font-semibold leading-6 tracking-[-0.03em] text-foreground sm:mt-1 sm:text-2xl">{overview.insights.unreadCount}</p>
            </div>
            <div className="min-w-0 w-full rounded-[1rem] border border-border/60 bg-muted/20 px-2.5 py-2 sm:px-3 sm:py-3">
              <p className="admin-kicker-label">Today</p>
              <p className="mt-0.5 text-[1.15rem] font-semibold leading-6 tracking-[-0.03em] text-foreground sm:mt-1 sm:text-2xl">{overview.insights.notificationsToday}</p>
            </div>
            <div className="min-w-0 w-full rounded-[1rem] border border-amber-200 bg-amber-50/70 px-2.5 py-2 sm:px-3 sm:py-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-amber-700">Attention</p>
              <p className="mt-0.5 text-[1.15rem] font-semibold leading-6 tracking-[-0.03em] text-amber-800 sm:mt-1 sm:text-2xl">{overview.insights.attentionAlertsOpen}</p>
            </div>
            <div className="min-w-0 w-full rounded-[1rem] border border-border/60 bg-muted/20 px-2.5 py-2 sm:px-3 sm:py-3">
              <p className="admin-kicker-label">New bookings</p>
              <p className="mt-0.5 text-base font-semibold leading-5 tracking-[-0.03em] text-foreground sm:mt-1 sm:text-xl">{overview.insights.newBookingsToday}</p>
            </div>
            <div className="min-w-0 w-full rounded-[1rem] border border-border/60 bg-muted/20 px-2.5 py-2 sm:px-3 sm:py-3">
              <p className="admin-kicker-label">Status updates</p>
              <p className="mt-0.5 text-base font-semibold leading-5 tracking-[-0.03em] text-foreground sm:mt-1 sm:text-xl">{overview.insights.statusUpdatesToday}</p>
            </div>
            <div className="min-w-0 w-full rounded-[1rem] border border-border/60 bg-muted/20 px-2.5 py-2 sm:px-3 sm:py-3">
              <p className="admin-kicker-label">Squad updates</p>
              <p className="mt-0.5 text-base font-semibold leading-5 tracking-[-0.03em] text-foreground sm:mt-1 sm:text-xl">{overview.insights.squadUpdatesToday}</p>
            </div>
          </div>

          <div className="mt-2.5 grid min-w-0 w-full max-w-full gap-2 sm:mt-4 sm:gap-3 md:grid-cols-2">
            <div className="min-w-0 w-full rounded-[1rem] border border-border/60 bg-muted/15 px-2.5 py-2 sm:px-3 sm:py-3">
              <p className="admin-kicker-label">
                Avg. read latency
              </p>
              <p className="admin-card-copy mt-0.5 text-foreground sm:mt-1">
                {overview.insights.averageReadLatencyMinutes === null
                  ? "Not enough read activity yet"
                  : `${overview.insights.averageReadLatencyMinutes} min`}
              </p>
            </div>
            <div className="min-w-0 w-full rounded-[1rem] border border-border/60 bg-muted/15 px-2.5 py-2 sm:px-3 sm:py-3">
              <p className="admin-kicker-label">
                Most frequent today
              </p>
              <p className="admin-card-copy mt-0.5 text-foreground sm:mt-1">
                {getTypeLabel(overview.insights.mostFrequentType)}
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 w-full max-w-full overflow-hidden rounded-[1.2rem] border border-border/70 bg-white/70 p-3 sm:p-4">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className="admin-card-title">
                {digest.title}
              </p>
              <p className="admin-meta-text">
                {overview.digest.cadence === "weekly"
                  ? "Weekly cadence is active in the rules panel."
                  : "Daily cadence is active in the rules panel."}
              </p>
            </div>
            <Link
              href="/admin/notifications?filter=unread"
              className="admin-button-text w-full max-w-full text-primary transition hover:text-primary/80 sm:w-auto"
            >
              Review unread
            </Link>
          </div>

          <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
            <div className="flex min-w-0 items-start justify-between gap-2 rounded-[1rem] border border-border/60 bg-muted/15 px-2.5 py-2 sm:px-3 sm:py-2.5">
              <span className="admin-card-copy min-w-0">Unread snapshot</span>
              <span className="admin-card-title shrink-0">{digest.unreadSnapshot}</span>
            </div>
            <div className="flex min-w-0 items-start justify-between gap-2 rounded-[1rem] border border-border/60 bg-muted/15 px-2.5 py-2 sm:px-3 sm:py-2.5">
              <span className="admin-card-copy min-w-0">New bookings</span>
              <span className="admin-card-title shrink-0">{digest.newBookings}</span>
            </div>
            <div className="flex min-w-0 items-start justify-between gap-2 rounded-[1rem] border border-border/60 bg-muted/15 px-2.5 py-2 sm:px-3 sm:py-2.5">
              <span className="admin-card-copy min-w-0">Status updates</span>
              <span className="admin-card-title shrink-0">{digest.statusUpdates}</span>
            </div>
            <div className="flex min-w-0 items-start justify-between gap-2 rounded-[1rem] border border-border/60 bg-muted/15 px-2.5 py-2 sm:px-3 sm:py-2.5">
              <span className="admin-card-copy min-w-0">Squad assignments</span>
              <span className="admin-card-title shrink-0">{digest.squadUpdates}</span>
            </div>
            <div className="flex min-w-0 items-start justify-between gap-2 rounded-[1rem] border border-amber-200 bg-amber-50/70 px-2.5 py-2 sm:px-3 sm:py-2.5">
              <span className="min-w-0 text-[12px] leading-5 text-amber-700">Attention alerts</span>
              <span className="shrink-0 text-[12px] font-semibold leading-5 text-amber-800">{digest.attentionAlerts}</span>
            </div>
          </div>

          <div className="mt-3 min-w-0 sm:mt-4">
            <p className="admin-kicker-label">
              Representative highlights
            </p>
            <div className="mt-2 min-w-0 space-y-2">
              {digest.highlights.length ? digest.highlights.map((item) => (
                <Link
                  key={item.id}
                  href={item.href || "/admin/notifications"}
                  className={`block min-w-0 max-w-full rounded-[1rem] border px-2.5 py-2 transition hover:bg-muted/35 sm:px-3 sm:py-2.5 ${getSeverityClasses(item.severity)}`}
                >
                  <p className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-semibold leading-5 text-foreground">{item.title}</p>
                  <p className="mt-0.5 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] leading-4">{item.message}</p>
                </Link>
              )) : (
                <p className="admin-empty-copy">
                  No digest highlights available yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
