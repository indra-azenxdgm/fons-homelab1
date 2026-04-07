import Link from "next/link";

import { cn } from "@/lib/utils";
import type { AdminCalendarView } from "@/features/admin/lib/shared/admin-calendar";

type AdminCalendarViewSwitcherProps = {
  activeView: AdminCalendarView;
  buildHref: (view: AdminCalendarView) => string;
};

const viewLabels: Record<AdminCalendarView, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

export function AdminCalendarViewSwitcher({
  activeView,
  buildHref,
}: AdminCalendarViewSwitcherProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-border/80 bg-muted/35 p-0.5">
      {(Object.keys(viewLabels) as AdminCalendarView[]).map((view) => (
        <Link
          key={view}
          href={buildHref(view)}
          className={cn(
            "inline-flex h-8 min-w-[3.9rem] items-center justify-center rounded-full px-3 text-[11px] font-medium tracking-[0.01em] transition",
            activeView === view
              ? "bg-foreground text-background shadow-sm"
              : "bg-white/80 text-muted-foreground hover:bg-white hover:text-foreground",
          )}
          aria-current={activeView === view ? "page" : undefined}
        >
          {viewLabels[view]}
        </Link>
      ))}
    </div>
  );
}
