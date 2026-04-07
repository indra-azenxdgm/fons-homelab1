"use client";

import { useState, useTransition } from "react";

import { updateAdminNotificationPreferencesBrowser } from "@/features/admin/api/notifications-browser-api";
import {
  dispatchNotificationPreferencesEvent,
} from "@/features/admin/lib/notification-preferences";
import type {
  AdminNotificationPreferences,
  AdminNotificationType,
} from "@/features/admin/lib/contracts";

type AdminNotificationPreferencesPanelProps = {
  initialPreferences: AdminNotificationPreferences;
  availableNotificationTypes: AdminNotificationType[];
};

const notificationTypeLabels: Record<AdminNotificationType, string> = {
  BOOKING_CREATED: "New bookings",
  BOOKING_STATUS_CHANGED: "Booking status updates",
  BOOKING_SQUADS_UPDATED: "Squad assignments",
  BOOKING_ATTENTION_REQUIRED: "Attention alerts",
};

export function AdminNotificationPreferencesPanel({
  initialPreferences,
  availableNotificationTypes,
}: AdminNotificationPreferencesPanelProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isPending, startTransition] = useTransition();

  function persist(nextPreferences: AdminNotificationPreferences) {
    setPreferences(nextPreferences);

    startTransition(() => {
      void (async () => {
        try {
          const result = await updateAdminNotificationPreferencesBrowser({
            toastEnabled: nextPreferences.toastEnabled,
            soundEnabled: nextPreferences.soundEnabled,
            typePreferences: nextPreferences.typePreferences,
          });

          setPreferences(result.notificationPreferences);
          dispatchNotificationPreferencesEvent({
            availableNotificationTypes: result.availableNotificationTypes,
            notificationPreferences: result.notificationPreferences,
          });
        } catch {
          setPreferences(initialPreferences);
        }
      })();
    });
  }

  return (
    <section className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="admin-section-title">
            Notification settings
          </p>
          <p className="admin-section-copy">
            Control live alerts without removing stored notifications from the inbox.
          </p>
        </div>
        {isPending ? (
          <span className="admin-card-copy">
            Saving...
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-[1.2rem] border border-border/70 bg-white/70 p-4">
          <p className="admin-card-title">
            In-app alerts
          </p>
          <p className="admin-meta-text mt-1">
            Toasts and sound apply only to new incoming notifications while you are inside the admin app.
          </p>

          <div className="mt-4 space-y-3">
            <label className="flex items-start justify-between gap-3">
              <span>
                <span className="admin-form-label block">
                  Show toast notifications
                </span>
                <span className="admin-form-helper block">
                  Display live in-app alerts for incoming events.
                </span>
              </span>
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[color:var(--primary)]"
                checked={preferences.toastEnabled}
                onChange={(event) =>
                  persist({
                    ...preferences,
                    toastEnabled: event.target.checked,
                  })
                }
              />
            </label>

            <label className="flex items-start justify-between gap-3">
              <span>
                <span className="admin-form-label block">
                  Play sound
                </span>
                <span className="admin-form-helper block">
                  Optional subtle sound for new realtime notifications.
                </span>
              </span>
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[color:var(--primary)]"
                checked={preferences.soundEnabled}
                onChange={(event) =>
                  persist({
                    ...preferences,
                    soundEnabled: event.target.checked,
                  })
                }
              />
            </label>
          </div>
        </div>

        <div className="rounded-[1.2rem] border border-border/70 bg-white/70 p-4">
          <p className="admin-card-title">
            Toast alert types
          </p>
          <p className="admin-meta-text mt-1">
            Choose which notification types can trigger live toasts and sound.
          </p>

          <div className="mt-4 space-y-3">
            {availableNotificationTypes.map((type) => (
              <label key={type} className="flex items-center justify-between gap-3">
                <span className="text-[12px] leading-5 text-foreground">
                  {notificationTypeLabels[type]}
                </span>
                <input
                  type="checkbox"
                  className="size-4 accent-[color:var(--primary)]"
                  checked={preferences.typePreferences[type]}
                  onChange={(event) =>
                    persist({
                      ...preferences,
                      typePreferences: {
                        ...preferences.typePreferences,
                        [type]: event.target.checked,
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
