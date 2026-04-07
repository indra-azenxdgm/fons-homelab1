"use client";

import { useRouter } from "next/navigation";
import { Archive, CheckCheck, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import {
  bulkArchiveAdminNotificationsBrowser,
  bulkMarkAdminNotificationsReadBrowser,
  bulkRestoreAdminNotificationsBrowser,
  getAdminNotificationsBrowser,
  markAdminNotificationReadBrowser,
} from "@/features/admin/api/notifications-browser-api";
import { formatNotificationRelativeTime } from "@/features/admin/lib/notification-format";
import type {
  AdminNotificationItem,
  AdminNotificationListResponse,
} from "@/features/admin/lib/shared/admin-notification-types";

type AdminNotificationsFeedProps = {
  initialNotifications: AdminNotificationListResponse;
};

type NotificationFilterKey =
  | "all"
  | "BOOKING_CREATED"
  | "BOOKING_STATUS_CHANGED"
  | "BOOKING_SQUADS_UPDATED"
  | "BOOKING_ATTENTION_REQUIRED"
  | "unread";

type NotificationViewMode = "active" | "archived";

const notificationFilterOptions: Array<{
  key: NotificationFilterKey;
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "BOOKING_CREATED", label: "New bookings" },
  { key: "BOOKING_STATUS_CHANGED", label: "Status updates" },
  { key: "BOOKING_SQUADS_UPDATED", label: "Squad assignments" },
  { key: "BOOKING_ATTENTION_REQUIRED", label: "Attention alerts" },
  { key: "unread", label: "Unread" },
];

function getInitialFilter(): NotificationFilterKey {
  if (typeof window === "undefined") {
    return "all";
  }

  const filter = new URLSearchParams(window.location.search).get("filter");

  if (
    filter === "unread"
    || filter === "BOOKING_CREATED"
    || filter === "BOOKING_STATUS_CHANGED"
    || filter === "BOOKING_SQUADS_UPDATED"
    || filter === "BOOKING_ATTENTION_REQUIRED"
  ) {
    return filter;
  }

  return "all";
}

function getNotificationTypeLabel(type: string) {
  if (type === "BOOKING_CREATED") {
    return "New booking";
  }

  if (type === "BOOKING_STATUS_CHANGED") {
    return "Status update";
  }

  if (type === "BOOKING_SQUADS_UPDATED") {
    return "Squad update";
  }

  if (type === "BOOKING_ATTENTION_REQUIRED") {
    return "Attention alert";
  }

  return "Notification";
}

function getSeverityBadgeClasses(severity: AdminNotificationItem["severity"]) {
  if (severity === "critical") {
    return "border-rose-200 bg-rose-50/80 text-rose-700";
  }

  if (severity === "warning") {
    return "border-amber-200 bg-amber-50/80 text-amber-700";
  }

  return "border-border/70 bg-white text-muted-foreground";
}

function getSeverityDotClass(severity: AdminNotificationItem["severity"], readAt: Date | null) {
  if (readAt) {
    return "bg-border";
  }

  if (severity === "critical") {
    return "bg-rose-500";
  }

  if (severity === "warning") {
    return "bg-amber-500";
  }

  return "bg-primary";
}

function isSameUtcDate(left: Date, right: Date) {
  return left.toISOString().slice(0, 10) === right.toISOString().slice(0, 10);
}

function groupNotificationsByTime(items: AdminNotificationItem[]) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = [
    {
      key: "today",
      label: "Today",
      items: [] as AdminNotificationItem[],
    },
    {
      key: "yesterday",
      label: "Yesterday",
      items: [] as AdminNotificationItem[],
    },
    {
      key: "earlier",
      label: "Earlier",
      items: [] as AdminNotificationItem[],
    },
  ];

  items.forEach((item) => {
    if (isSameUtcDate(item.createdAt, now)) {
      groups[0].items.push(item);
      return;
    }

    if (isSameUtcDate(item.createdAt, yesterday)) {
      groups[1].items.push(item);
      return;
    }

    groups[2].items.push(item);
  });

  return groups.filter((group) => group.items.length);
}

export function AdminNotificationsFeed({
  initialNotifications,
}: AdminNotificationsFeedProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<NotificationFilterKey>(() => getInitialFilter());
  const [viewMode, setViewMode] = useState<NotificationViewMode>("active");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  async function refreshNotifications(nextView = viewMode) {
    const result = await getAdminNotificationsBrowser({ page: 1, limit: 50, view: nextView });
    setNotifications(result);
  }

  useEffect(() => {
    let isActive = true;

    async function safeRefresh(nextView = viewMode) {
      try {
        const result = await getAdminNotificationsBrowser({
          page: 1,
          limit: 50,
          view: nextView,
        });

        if (isActive) {
          setNotifications(result);
        }
      } catch {
        // Keep current list if refresh fails.
      }
    }

    function onFocus() {
      void safeRefresh();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void safeRefresh();
      }
    }

    void safeRefresh(viewMode);
    const interval = window.setInterval(() => {
      void safeRefresh();
    }, 30000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isActive = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [viewMode]);

  function updateItemRead(notificationId: string) {
    setNotifications((current) => ({
      ...current,
      unreadCount: Math.max(
        0,
        current.unreadCount - (current.items.find((item) => item.id === notificationId && !item.readAt) ? 1 : 0),
      ),
      items: current.items.map((item) =>
        item.id === notificationId && !item.readAt
          ? {
              ...item,
              readAt: new Date(),
            }
          : item,
      ),
    }));
  }

  function handleOpenNotification(notificationId: string, href: string | null, readAt: Date | null) {
    startTransition(() => {
      void (async () => {
        if (!readAt) {
          updateItemRead(notificationId);

          try {
            await markAdminNotificationReadBrowser(notificationId);
          } catch {
            router.refresh();
            return;
          }
        }

        router.push(href || "/admin/bookings");
      })();
    });
  }

  async function runBulkAction(action: () => Promise<unknown>) {
    try {
      await action();
      setSelectedIds([]);
      await refreshNotifications();
    } catch {
      router.refresh();
    }
  }

  const filteredNotifications = useMemo(() => {
    const ordered = [...notifications.items].sort(
      (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
    );

    if (activeFilter === "all") {
      return ordered;
    }

    if (activeFilter === "unread") {
      return ordered.filter((item) => !item.readAt);
    }

    return ordered.filter((item) => item.type === activeFilter);
  }, [activeFilter, notifications.items]);

  const groupedNotifications = useMemo(
    () => groupNotificationsByTime(filteredNotifications),
    [filteredNotifications],
  );

  const unreadVisibleIds = filteredNotifications.filter((item) => !item.readAt).map((item) => item.id);
  const readVisibleIds = filteredNotifications.filter((item) => Boolean(item.readAt)).map((item) => item.id);
  const selectedVisibleIds = filteredNotifications
    .filter((item) => selectedIds.includes(item.id))
    .map((item) => item.id);
  const allVisibleSelected = Boolean(
    filteredNotifications.length
    && filteredNotifications.every((item) => selectedIds.includes(item.id)),
  );

  function toggleSelected(notificationId: string) {
    setSelectedIds((current) =>
      current.includes(notificationId)
        ? current.filter((id) => id !== notificationId)
        : [...current, notificationId],
    );
  }

  function toggleSelectAllVisible() {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !filteredNotifications.some((item) => item.id === id));
      }

      return [...new Set([...current, ...filteredNotifications.map((item) => item.id)])];
    });
  }

  function handleChangeViewMode(nextView: NotificationViewMode) {
    setSelectedIds([]);
    setViewMode(nextView);
  }

  return (
    <section className="panel min-w-0 max-w-full overflow-hidden">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2.5 border-b border-border/70 px-3.5 py-3 sm:gap-3 sm:px-5 sm:py-4">
        <div className="min-w-0 flex-1">
          <p className="admin-section-title">
            Notifications
          </p>
          <p className="admin-section-copy">
            Active notifications stay operational. Archived items remain available for audit and recovery.
          </p>
        </div>
        <div className="flex w-full min-w-0 max-w-full flex-wrap gap-1.5 sm:w-auto sm:gap-2">
          <button
            type="button"
            onClick={() => handleChangeViewMode("active")}
            className={`admin-button-text inline-flex min-h-8 items-center rounded-full border px-2.5 py-1 transition sm:px-3 sm:py-1.5 ${
              viewMode === "active"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/80 bg-white text-muted-foreground hover:border-[color:var(--border-strong)] hover:bg-secondary hover:text-foreground"
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => handleChangeViewMode("archived")}
            className={`admin-button-text inline-flex min-h-8 items-center rounded-full border px-2.5 py-1 transition sm:px-3 sm:py-1.5 ${
              viewMode === "archived"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/80 bg-white text-muted-foreground hover:border-[color:var(--border-strong)] hover:bg-secondary hover:text-foreground"
            }`}
          >
            Archived
          </button>
          {viewMode === "active" && unreadVisibleIds.length ? (
            <button
              type="button"
              onClick={() =>
                startTransition(() => {
                  void runBulkAction(() => bulkMarkAdminNotificationsReadBrowser(unreadVisibleIds));
                })}
              disabled={isPending}
              className="admin-button-text inline-flex min-h-8 items-center gap-1 rounded-full border border-border/80 px-2.5 py-1 text-muted-foreground transition hover:border-[color:var(--border-strong)] hover:bg-secondary hover:text-foreground disabled:opacity-60 sm:gap-1.5 sm:px-3 sm:py-1.5"
            >
              <CheckCheck className="size-3.5" />
              Mark visible as read
            </button>
          ) : null}
          {viewMode === "active" && readVisibleIds.length ? (
            <button
              type="button"
              onClick={() =>
                startTransition(() => {
                  void runBulkAction(() =>
                    bulkArchiveAdminNotificationsBrowser({
                      readOnly: true,
                    }),
                  );
                })}
              disabled={isPending}
              className="admin-button-text inline-flex min-h-8 items-center gap-1 rounded-full border border-border/80 px-2.5 py-1 text-muted-foreground transition hover:border-[color:var(--border-strong)] hover:bg-secondary hover:text-foreground disabled:opacity-60 sm:gap-1.5 sm:px-3 sm:py-1.5"
            >
              <Archive className="size-3.5" />
              Archive all read
            </button>
          ) : null}
        </div>
      </div>

      <div className="border-b border-border/70 px-3.5 py-2.5 sm:px-5 sm:py-3">
        <div className="flex min-w-0 max-w-full flex-wrap gap-1.5 sm:gap-2">
          {notificationFilterOptions.map((option) => {
            const isActive = option.key === activeFilter;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setActiveFilter(option.key);
                  setSelectedIds([]);
                }}
                className={`admin-button-text inline-flex min-h-8 max-w-full items-center rounded-full border px-2.5 py-1 transition sm:px-3 sm:py-1.5 ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/80 bg-white text-muted-foreground hover:border-[color:var(--border-strong)] hover:bg-secondary hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {selectedVisibleIds.length ? (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2.5 border-b border-border/70 bg-muted/15 px-3.5 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
          <p className="admin-card-title">
            {selectedVisibleIds.length} selected
          </p>
          <div className="flex w-full min-w-0 max-w-full flex-wrap gap-1.5 sm:w-auto sm:gap-2">
            {viewMode === "active" ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    startTransition(() => {
                      void runBulkAction(() => bulkMarkAdminNotificationsReadBrowser(selectedVisibleIds));
                    })}
                  disabled={isPending}
                  className="admin-button-text inline-flex min-h-8 items-center gap-1 rounded-full border border-border/80 px-2.5 py-1 text-muted-foreground transition hover:border-[color:var(--border-strong)] hover:bg-secondary hover:text-foreground disabled:opacity-60 sm:gap-1.5 sm:px-3 sm:py-1.5"
                >
                  <CheckCheck className="size-3.5" />
                  Mark selected as read
                </button>
                <button
                  type="button"
                  onClick={() =>
                    startTransition(() => {
                      void runBulkAction(() =>
                        bulkArchiveAdminNotificationsBrowser({
                          ids: selectedVisibleIds,
                        }),
                      );
                    })}
                  disabled={isPending}
                  className="admin-button-text inline-flex min-h-8 items-center gap-1 rounded-full border border-border/80 px-2.5 py-1 text-muted-foreground transition hover:border-[color:var(--border-strong)] hover:bg-secondary hover:text-foreground disabled:opacity-60 sm:gap-1.5 sm:px-3 sm:py-1.5"
                >
                  <Archive className="size-3.5" />
                  Archive selected
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() =>
                  startTransition(() => {
                    void runBulkAction(() => bulkRestoreAdminNotificationsBrowser(selectedVisibleIds));
                  })}
                disabled={isPending}
                className="admin-button-text inline-flex min-h-8 items-center gap-1 rounded-full border border-border/80 px-2.5 py-1 text-muted-foreground transition hover:border-[color:var(--border-strong)] hover:bg-secondary hover:text-foreground disabled:opacity-60 sm:gap-1.5 sm:px-3 sm:py-1.5"
              >
                <RotateCcw className="size-3.5" />
                Restore selected
              </button>
            )}
          </div>
        </div>
      ) : null}

      {groupedNotifications.length ? (
        <div className="min-w-0 max-w-full">
          <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-border/50 bg-muted/10 px-3.5 py-2 sm:gap-3 sm:px-5 sm:py-2.5">
            <label className="admin-button-text inline-flex min-w-0 items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
                className="size-3.5 rounded border-border text-primary focus:ring-primary/30 sm:size-4"
              />
              Select visible
            </label>
            <p className="admin-meta-text min-w-0 flex-1">
              {viewMode === "active"
                ? "Unread notifications remain active until read or archived."
                : "Archived notifications are excluded from the bell, dashboard, and live alerts."}
            </p>
          </div>

          {groupedNotifications.map((group) => (
            <section key={group.key} className="min-w-0">
              <div className="border-b border-border/50 bg-muted/15 px-3.5 py-2 sm:px-5 sm:py-2.5">
                <p className="admin-kicker-label">
                  {group.label}
                </p>
              </div>

              <div className="min-w-0 divide-y divide-border/70">
                {group.items.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex min-w-0 items-start gap-2.5 px-3.5 py-2.5 transition hover:bg-muted/20 sm:gap-3 sm:px-5 sm:py-4"
                  >
                    <label className="mt-1 inline-flex shrink-0 sm:mt-1.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notification.id)}
                        onChange={() => toggleSelected(notification.id)}
                        className="size-3.5 rounded border-border text-primary focus:ring-primary/30 sm:size-4"
                        aria-label={`Select notification ${notification.title}`}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => handleOpenNotification(notification.id, notification.href, notification.readAt)}
                      className="flex min-w-0 max-w-full flex-1 items-start gap-2.5 text-left sm:gap-4"
                    >
                      <span
                        className={`mt-1 size-2 shrink-0 rounded-full sm:mt-1.5 sm:size-2.5 ${
                          getSeverityDotClass(notification.severity, notification.readAt)
                        }`}
                      />
                      <span className="min-w-0 max-w-full flex-1">
                        <span className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <span className="min-w-0 flex-1">
                            <span className={`block text-[12px] leading-[1.15rem] sm:leading-5 ${notification.readAt ? "font-medium text-foreground/88" : "font-semibold text-foreground"}`}>
                              {notification.title}
                            </span>
                            <span className="mt-1 flex min-w-0 max-w-full flex-wrap gap-1">
                              <span className="admin-pill-text inline-flex max-w-full rounded-full border border-border/70 bg-white px-1.5 py-0.5 text-muted-foreground sm:px-2">
                                {getNotificationTypeLabel(notification.type)}
                              </span>
                              <span className={`admin-pill-text inline-flex max-w-full rounded-full border px-1.5 py-0.5 sm:px-2 ${getSeverityBadgeClasses(notification.severity)}`}>
                                {notification.severity}
                              </span>
                              {viewMode === "archived" ? (
                                <span className="admin-pill-text inline-flex max-w-full rounded-full border border-border/70 bg-muted/20 px-1.5 py-0.5 text-muted-foreground sm:px-2">
                                  Archived
                                </span>
                              ) : null}
                              <span className="admin-pill-text inline-flex max-w-full rounded-full border border-border/70 bg-white px-1.5 py-0.5 text-muted-foreground sm:px-2">
                                {notification.audienceRole ? `${notification.audienceRole.replaceAll("_", " ")}` : notification.audienceType.replaceAll("_", " ")}
                              </span>
                            </span>
                          </span>
                          <span className="admin-meta-text shrink-0 whitespace-nowrap sm:pt-0.5">
                            {formatNotificationRelativeTime(notification.createdAt)}
                          </span>
                        </span>
                        <span className="mt-1 block text-[12px] leading-[1.35] text-foreground/88 sm:leading-5">
                          {notification.message}
                        </span>
                        {notification.detail ? (
                          <span className="admin-meta-text mt-0.5 block">
                            {notification.detail}
                          </span>
                        ) : null}
                        {notification.archivedAt ? (
                          <span className="admin-meta-text mt-0.5 block">
                            Archived {formatNotificationRelativeTime(notification.archivedAt)}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="px-4 py-10 text-center sm:px-6 sm:py-14">
          <p className="admin-empty-title">
            {viewMode === "active" ? "No active notifications found" : "No archived notifications yet"}
          </p>
          <p className="admin-empty-copy mt-2">
            {viewMode === "active"
              ? "Try another filter or wait for new booking activity."
              : "Read notifications can be archived here once they are no longer operationally relevant."}
          </p>
        </div>
      )}
    </section>
  );
}
