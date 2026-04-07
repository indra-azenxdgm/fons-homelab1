export const adminCalendarViews = ["day", "week", "month"] as const;

export type AdminCalendarView = (typeof adminCalendarViews)[number];

export function toAdminCalendarView(view?: string): AdminCalendarView {
  return adminCalendarViews.includes(view as AdminCalendarView)
    ? (view as AdminCalendarView)
    : "month";
}
