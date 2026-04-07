"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { pushAppToast } from "@/components/app-toast-viewport";
import {
  getAdminNotificationsBrowser,
  markAdminNotificationReadBrowser,
  markAllAdminNotificationsReadBrowser,
} from "@/features/admin/api/notifications-browser-api";
import { AdminSidebarPopout } from "@/features/admin/components/admin-sidebar-popout";
import { formatNotificationRelativeTime } from "@/features/admin/lib/notification-format";
import {
  enableNotificationAudioOnInteraction,
  NOTIFICATION_PREFERENCES_EVENT,
  playNotificationSound,
} from "@/features/admin/lib/notification-preferences";
import { cn } from "@/lib/utils";
import type {
  AdminNotificationPreferences,
  AdminNotificationType,
} from "@/features/admin/lib/contracts";
import type {
  AdminNotificationItem,
  AdminNotificationListResponse,
} from "@/features/admin/lib/shared/admin-notification-types";

type AdminNotificationBellProps = {
  initialNotifications: AdminNotificationListResponse;
  initialPreferences: AdminNotificationPreferences;
  availableNotificationTypes: AdminNotificationType[];
  mode?: "icon" | "sidebar-row";
  triggerClassName?: string;
  iconClassName?: string;
  title?: string;
  subtitle?: string;
};

function getBadgeLabel(unreadCount: number) {
  return unreadCount > 99 ? "99+" : String(unreadCount);
}

function getSeverityDotClass(
  severity: AdminNotificationItem["severity"],
  readAt: Date | null,
) {
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

export function AdminNotificationBell({
  initialNotifications,
  initialPreferences,
  availableNotificationTypes,
  mode = "icon",
  triggerClassName,
  iconClassName,
  title = "Notifications",
  subtitle,
}: AdminNotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isPending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const seenNotificationIdsRef = useRef(new Set(initialNotifications.items.map((item) => item.id)));
  const hasCompletedInitialPollRef = useRef(false);

  useEffect(() => enableNotificationAudioOnInteraction(), []);

  useEffect(() => {
    function onPreferencesUpdated(event: Event) {
      const customEvent = event as CustomEvent<{
        availableNotificationTypes: AdminNotificationType[];
        notificationPreferences: AdminNotificationPreferences;
      }>;

      if (!customEvent.detail) {
        return;
      }

      setPreferences(customEvent.detail.notificationPreferences);
    }

    window.addEventListener(NOTIFICATION_PREFERENCES_EVENT, onPreferencesUpdated as EventListener);

    return () => {
      window.removeEventListener(NOTIFICATION_PREFERENCES_EVENT, onPreferencesUpdated as EventListener);
    };
  }, []);

  function showToastForNotification(notification: AdminNotificationItem) {
    pushAppToast({
      id: notification.id,
      title: notification.title,
      description: notification.message,
      href: notification.href || undefined,
    });
  }

  function mergeSeenNotificationIds(items: AdminNotificationItem[]) {
    items.forEach((item) => {
      seenNotificationIdsRef.current.add(item.id);
    });
  }

  function handleIncomingNotifications(nextNotifications: AdminNotificationListResponse) {
    const nextItems = nextNotifications.items;

    if (!hasCompletedInitialPollRef.current) {
      mergeSeenNotificationIds(nextItems);
      hasCompletedInitialPollRef.current = true;
      setNotifications(nextNotifications);
      return;
    }

    const newItems = nextItems.filter((item) => !seenNotificationIdsRef.current.has(item.id));
    mergeSeenNotificationIds(nextItems);
    setNotifications(nextNotifications);

    const newestToastCandidate = [...newItems]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .at(0);

    if (
      newestToastCandidate
      && preferences.toastEnabled
      && availableNotificationTypes.includes(newestToastCandidate.type)
      && preferences.typePreferences[newestToastCandidate.type]
    ) {
      showToastForNotification(newestToastCandidate);

      if (preferences.soundEnabled) {
        playNotificationSound();
      }
    }
  }

  async function refreshNotifications() {
    const result = await getAdminNotificationsBrowser({ limit: 6, view: "active" });
    handleIncomingNotifications(result);
  }

  useEffect(() => {
    let isActive = true;

    async function safeRefresh() {
      try {
        const result = await getAdminNotificationsBrowser({ limit: 6, view: "active" });

        if (isActive) {
          handleIncomingNotifications(result);
        }
      } catch {
        // Preserve the last known inbox state if background refresh fails.
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

    void safeRefresh();
    const interval = window.setInterval(safeRefresh, 30000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isActive = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  function updateLocalReadState(notificationId: string) {
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

  const orderedNotifications = [...notifications.items].sort((left, right) => {
    if (Boolean(left.readAt) !== Boolean(right.readAt)) {
      return left.readAt ? 1 : -1;
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });

  async function handleOpenNotification(notification: AdminNotificationItem) {
    if (!notification.readAt) {
      updateLocalReadState(notification.id);

      try {
        await markAdminNotificationReadBrowser(notification.id);
      } catch {
        void refreshNotifications();
      }
    }

    setIsOpen(false);
    router.push(notification.href || "/admin/notifications");
  }

  function handleMarkAllAsRead() {
    startTransition(() => {
      void (async () => {
        try {
          await markAllAdminNotificationsReadBrowser();

          setNotifications((current) => ({
            ...current,
            unreadCount: 0,
            items: current.items.map((item) => ({
              ...item,
              readAt: item.readAt || new Date(),
            })),
          }));
        } catch {
          await refreshNotifications();
        }
      })();
    });
  }

  return (
    <>
      <div className="relative">
        {mode === "sidebar-row" ? (
          <button
            ref={triggerRef}
            type="button"
            className={cn(
              "group flex w-full items-center gap-2 rounded-[0.8rem] border border-transparent px-2 py-1.5 text-left text-[11px] leading-4 font-medium text-sidebar-foreground/74 transition hover:border-border/70 hover:bg-white/92 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              triggerClassName,
            )}
            aria-label="Notifications"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((value) => !value)}
          >
            <span className="relative flex size-6.5 shrink-0 items-center justify-center rounded-[0.7rem] border border-sidebar-border/80 bg-white/92 text-muted-foreground transition group-hover:border-[color:var(--border-strong)] group-hover:text-foreground">
              <Bell className={cn("size-[14px]", iconClassName)} />
              {notifications.unreadCount ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-4.5 items-center justify-center rounded-full bg-primary px-1 py-0.5 text-[9px] font-semibold leading-none text-white">
                  {getBadgeLabel(notifications.unreadCount)}
                </span>
              ) : null}
            </span>
              <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] leading-4">
                {title}
              </span>
              {subtitle ? (
                <span className="block truncate text-[10px] leading-4 text-muted-foreground">
                  {subtitle}
                </span>
              ) : null}
            </span>
          </button>
        ) : (
          <button
            ref={triggerRef}
            type="button"
            className={cn(
              "relative inline-flex size-9 items-center justify-center rounded-[0.9rem] border border-border/80 bg-white text-foreground shadow-none transition hover:border-[color:var(--border-strong)] hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              triggerClassName,
            )}
            aria-label="Notifications"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((value) => !value)}
          >
            <Bell className={cn("size-4", iconClassName)} />
            {notifications.unreadCount ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                {getBadgeLabel(notifications.unreadCount)}
              </span>
            ) : null}
          </button>
        )}
      </div>

      <AdminSidebarPopout
        open={isOpen}
        triggerRef={triggerRef}
        onClose={() => setIsOpen(false)}
        className="w-[min(21rem,calc(100vw-1.5rem))] overflow-hidden"
      >
        <div>
              <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
                <div>
                  <p className="admin-card-title">
                    Notifications
                  </p>
                  <p className="admin-meta-text">
                    {notifications.unreadCount
                      ? `${notifications.unreadCount} unread`
                      : "No unread notifications"}
                  </p>
                </div>
                {notifications.unreadCount ? (
                  <button
                    type="button"
                    className="admin-button-text inline-flex items-center gap-1 rounded-full border border-border/80 px-2.5 py-1 text-muted-foreground transition hover:border-[color:var(--border-strong)] hover:bg-secondary hover:text-foreground disabled:opacity-60"
                    onClick={handleMarkAllAsRead}
                    disabled={isPending}
                  >
                    <CheckCheck className="size-3.5" />
                    Mark all read
                  </button>
                ) : null}
              </div>

              <div className="max-h-[min(24rem,70vh)] overflow-y-auto">
                {notifications.items.length ? (
                  <div className="divide-y divide-border/70">
                    {orderedNotifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => void handleOpenNotification(notification)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/35"
                      >
                        <span
                          className={`mt-1.5 size-2 shrink-0 rounded-full ${
                            getSeverityDotClass(notification.severity, notification.readAt)
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-3">
                            <span className={`block text-[12px] leading-5 ${notification.readAt ? "font-medium text-foreground/88" : "font-semibold text-foreground"}`}>
                              {notification.title}
                            </span>
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {formatNotificationRelativeTime(notification.createdAt)}
                            </span>
                          </span>
                          <span className="mt-1 block text-[11px] leading-4 text-foreground/88">
                            {notification.message}
                          </span>
                          {notification.severity !== "info" ? (
                            <span className={`admin-pill-text mt-1 inline-flex rounded-full border px-2 py-0.5 ${
                              notification.severity === "critical"
                                ? "border-rose-200 bg-rose-50/80 text-rose-700"
                                : "border-amber-200 bg-amber-50/80 text-amber-700"
                            }`}>
                              {notification.severity}
                            </span>
                          ) : null}
                          {notification.detail ? (
                            <span className="admin-meta-text mt-0.5 block">
                              {notification.detail}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <p className="admin-empty-title">
                      No notifications yet
                    </p>
                    <p className="admin-empty-copy mt-1">
                      Incoming booking activity will appear here.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-border/70 bg-muted/20 px-4 py-3">
                <Link
                  href="/admin/notifications"
                  className="admin-button-text-strong inline-flex text-primary transition hover:text-primary/80"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
        </div>
      </AdminSidebarPopout>
    </>
  );
}
