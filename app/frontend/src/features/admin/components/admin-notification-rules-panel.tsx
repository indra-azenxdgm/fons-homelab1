"use client";

import { useState, useTransition } from "react";

import { updateAdminNotificationRulesBrowser } from "@/features/admin/api/notifications-browser-api";
import type { AdminNotificationRules } from "@/features/admin/lib/contracts";

type AdminNotificationRulesPanelProps = {
  initialRules: AdminNotificationRules;
};

const ruleLabels = {
  BOOKING_CREATED: "New bookings",
  BOOKING_STATUS_CHANGED: "Status updates",
  BOOKING_SQUADS_UPDATED: "Squad assignments",
  BOOKING_ATTENTION_REQUIRED: "Attention alerts",
} as const;

export function AdminNotificationRulesPanel({
  initialRules,
}: AdminNotificationRulesPanelProps) {
  const [rules, setRules] = useState(initialRules);
  const [isPending, startTransition] = useTransition();

  function persist(nextRules: AdminNotificationRules) {
    setRules(nextRules);

    startTransition(() => {
      void (async () => {
        try {
          const result = await updateAdminNotificationRulesBrowser(nextRules);
          setRules(result.rules);
        } catch {
          setRules(initialRules);
        }
      })();
    });
  }

  return (
    <section className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="admin-section-title">
            Notification rules
          </p>
          <p className="admin-section-copy">
            Global delivery rules for stored events, digest cadence, and SLA thresholds.
          </p>
        </div>
        {isPending ? (
          <span className="admin-card-copy">Saving...</span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-[1.2rem] border border-border/70 bg-white/70 p-4">
          <p className="admin-card-title">
            Stored event types
          </p>
          <p className="admin-meta-text mt-1">
            Disabled types stop generating new notification records for future events.
          </p>

          <div className="mt-4 space-y-3">
            {Object.entries(ruleLabels).map(([type, label]) => (
              <label key={type} className="flex items-center justify-between gap-3">
                <span className="text-[12px] leading-5 text-foreground">{label}</span>
                <input
                  type="checkbox"
                  className="size-4 accent-[color:var(--primary)]"
                  checked={rules.eventTypeEnabled[type as keyof typeof rules.eventTypeEnabled]}
                  onChange={(event) =>
                    persist({
                      ...rules,
                      eventTypeEnabled: {
                        ...rules.eventTypeEnabled,
                        [type]: event.target.checked,
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-[1.2rem] border border-border/70 bg-white/70 p-4">
          <p className="admin-card-title">
            Digest and SLA
          </p>
          <p className="admin-meta-text mt-1">
            Control digest cadence and when stale operational bookings should escalate.
          </p>

          <div className="mt-4 space-y-4">
            <label className="flex items-center justify-between gap-3">
              <span className="text-[12px] leading-5 text-foreground">Digest cadence</span>
              <select
                className="rounded-full border border-border/80 bg-white px-3 py-1.5 text-[11px] leading-4 text-foreground"
                value={rules.digestCadence}
                onChange={(event) =>
                  persist({
                    ...rules,
                    digestCadence: event.target.value as AdminNotificationRules["digestCadence"],
                  })
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>

            <label className="flex items-center justify-between gap-3">
              <span className="text-[12px] leading-5 text-foreground">Enable SLA alerts</span>
              <input
                type="checkbox"
                className="size-4 accent-[color:var(--primary)]"
                checked={rules.sla.enabled}
                onChange={(event) =>
                  persist({
                    ...rules,
                    sla: {
                      ...rules.sla,
                      enabled: event.target.checked,
                    },
                  })
                }
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { key: "pendingHours", label: "Pending hours" },
                { key: "confirmedHours", label: "Confirmed hours" },
                { key: "assignedHours", label: "Assigned hours" },
                { key: "inProgressHours", label: "In progress hours" },
              ].map((field) => (
                <label key={field.key} className="space-y-1.5">
                  <span className="admin-form-label block text-muted-foreground">
                    {field.label}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={rules.sla[field.key as keyof typeof rules.sla] as number}
                    onChange={(event) =>
                      persist({
                        ...rules,
                        sla: {
                          ...rules.sla,
                          [field.key]: Number(event.target.value) || 1,
                        },
                      })
                    }
                    className="w-full rounded-[0.9rem] border border-border/80 bg-white px-3 py-2 text-[11px] leading-4 text-foreground"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
