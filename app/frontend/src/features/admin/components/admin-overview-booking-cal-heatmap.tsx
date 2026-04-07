type AdminOverviewBookingCalHeatmapProps = {
  heatmap: {
    startDate: string;
    endDate: string;
    periodLabel: string;
    totalBookings: number;
    maxCellCount: number;
    weekdays: Array<{
      value: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
      label: string;
      count: number;
    }>;
    slots: Array<{
      value: "SLOT_0900" | "SLOT_1100" | "SLOT_1300" | "SLOT_1500";
      label: string;
      count: number;
      cells: Array<{
        weekday: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
        count: number;
      }>;
    }>;
    busiestDay: {
      value: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
      label: string;
      count: number;
    } | null;
    busiestSlot: {
      value: "SLOT_0900" | "SLOT_1100" | "SLOT_1300" | "SLOT_1500";
      label: string;
      count: number;
    } | null;
  };
};

const heatmapPalette = {
  zero: {
    background: "#F4F8FB",
    border: "#D7E3EC",
    text: "#6C8093",
    fill: "#DCE8F1",
  },
  low: {
    background: "#DDF2E4",
    border: "#B7DEC2",
    text: "#244F33",
    fill: "#78B98C",
  },
  medium: {
    background: "#F7EDB8",
    border: "#E8D98B",
    text: "#6D5615",
    fill: "#D9C25D",
  },
  high: {
    background: "#F4CBA8",
    border: "#E6A97B",
    text: "#6B3519",
    fill: "#D98755",
  },
  peak: {
    background: "#D96A63",
    border: "#BF4C45",
    text: "#FFF8F5",
    fill: "#C94E46",
  },
} as const;

const heatmapLegendSteps = [
  { label: "Empty", color: heatmapPalette.zero.background },
  { label: "Low", color: heatmapPalette.low.background },
  { label: "Medium", color: heatmapPalette.medium.background },
  { label: "High", color: heatmapPalette.high.background },
  { label: "Peak", color: heatmapPalette.peak.background },
] as const;

function getHeatmapLevel(count: number, maxCount: number) {
  if (count === 0 || maxCount === 0) {
    return "zero";
  }

  const ratio = count / maxCount;

  if (ratio >= 0.8) {
    return "peak";
  }

  if (ratio >= 0.58) {
    return "high";
  }

  if (ratio >= 0.34) {
    return "medium";
  }

  return "low";
}

function getHeatmapCellStyle(count: number, maxCount: number) {
  const level = getHeatmapLevel(count, maxCount);
  const palette = heatmapPalette[level];

  return {
    backgroundColor: palette.background,
    borderColor: palette.border,
    color: palette.text,
  };
}

function getWeekdayMeterColor(count: number, maxCount: number) {
  const level = getHeatmapLevel(count, maxCount);

  return heatmapPalette[level].fill;
}

function getSlotLoadBarColor(count: number, maxCount: number) {
  const level = getHeatmapLevel(count, maxCount);

  return heatmapPalette[level].fill;
}

const compactWeekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];

export function AdminOverviewBookingCalHeatmap({
  heatmap,
}: AdminOverviewBookingCalHeatmapProps) {
  const weekdayPeak = Math.max(0, ...heatmap.weekdays.map((weekday) => weekday.count));
  const sortedBusySlots = heatmap.slots
    .filter((slot) => slot.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="min-w-0 max-w-full space-y-2.5">
      <div className="grid min-w-0 items-start gap-2.5 xl:grid-cols-[minmax(0,1fr)_200px]">
        <div className="min-w-0 rounded-[1.34rem] border border-border/70 bg-white px-2.5 py-2.5 shadow-[0_12px_30px_-22px_rgba(0,81,162,0.35)] sm:px-3 sm:py-3">
          <div className="min-w-0 overflow-hidden rounded-[1.18rem] border border-[#D8E7F5] bg-[#F7FBFF] p-2 sm:p-2.5">
            <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
              <div className="admin-pill-text rounded-full border border-[#C9DDF2] bg-white px-2.5 py-1 text-muted-foreground">
                Weekday matrix
              </div>
              <div className="admin-pill-text rounded-full border border-[#D8E7F5] bg-[#EAF4FF] px-2.5 py-1 text-[#1B75BE]">
                {heatmap.periodLabel}
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-[44px_repeat(7,minmax(0,1fr))] gap-1 sm:grid-cols-[56px_repeat(7,minmax(0,1fr))] sm:gap-1.5">
              <div className="flex min-w-0 items-center px-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px]">
                Slot
              </div>

              {heatmap.weekdays.map((weekday, index) => (
                <div
                  key={weekday.value}
                  className="min-w-0 rounded-[0.7rem] border border-[#D7E3EC] bg-white px-1 py-1 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:rounded-[0.8rem] sm:px-1.5 sm:py-1.5"
                >
                  <p className="text-[9px] font-semibold uppercase tracking-[0.02em] text-foreground sm:text-[10px]">
                    {compactWeekdayLabels[index]}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-muted-foreground sm:text-[11px]">
                    {weekday.count}
                  </p>
                  <div className="mt-1.5 h-1 rounded-full bg-[#EDF3F7]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: getWeekdayMeterColor(weekday.count, weekdayPeak),
                        width: `${weekdayPeak > 0 ? Math.max((weekday.count / weekdayPeak) * 100, weekday.count ? 14 : 0) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              {heatmap.slots.map((slot) => (
                <div key={slot.value} className="contents">
                  <div className="flex min-h-[42px] min-w-0 flex-col justify-center rounded-[0.7rem] border border-[#D6E6F7] bg-white px-1.5 sm:min-h-[48px] sm:rounded-[0.8rem] sm:px-2">
                    <p className="truncate text-[10px] font-semibold text-foreground sm:text-[12px]">{slot.label}</p>
                    <p className="text-[8px] uppercase tracking-[0.08em] text-muted-foreground sm:text-[9px]">
                      {slot.count} total
                    </p>
                  </div>

                  {slot.cells.map((cell) => (
                    <div
                      key={`${slot.value}-${cell.weekday}`}
                      className="flex min-h-[42px] min-w-0 items-center justify-center rounded-[0.7rem] border px-1 py-1 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition sm:min-h-[48px] sm:rounded-[0.8rem] sm:px-1.5 sm:py-1.5"
                      style={getHeatmapCellStyle(cell.count, heatmap.maxCellCount)}
                    >
                      <span className="text-[14px] font-semibold leading-none tracking-[-0.04em] sm:text-[17px]">
                        {cell.count}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
              {heatmapLegendSteps.map((step) => (
                <div key={step.label} className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="h-2.5 w-6 shrink-0 rounded-full border border-white/70 sm:w-7"
                    style={{ backgroundColor: step.color }}
                  />
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden auto-rows-min gap-2.5 xl:grid">
          <div className="rounded-[1.1rem] border border-border/70 bg-white px-4 py-2.5">
            <p className="admin-kicker-label">
              Period volume
            </p>
            <p className="mt-1 text-2xl font-semibold leading-none tracking-[-0.03em] text-foreground">
              {heatmap.totalBookings}
            </p>
            <p className="admin-meta-text mt-1">{heatmap.periodLabel}</p>
          </div>

          <div className="rounded-[1.1rem] border border-border/70 bg-white px-4 py-2.5">
            <p className="admin-kicker-label">
              Busiest day
            </p>
            <p className="mt-1 text-[12px] font-semibold leading-5 text-foreground">
              {heatmap.busiestDay?.label || "-"}
            </p>
            <p className="admin-meta-text mt-1">
              {heatmap.busiestDay?.count || 0} bookings
            </p>
          </div>

          <div className="rounded-[1.1rem] border border-border/70 bg-white px-4 py-2.5">
            <p className="admin-kicker-label">
              Busy times
            </p>
            <div className="mt-2.5 space-y-2">
              {sortedBusySlots.map((slot) => (
                  <div
                    key={slot.value}
                    className="rounded-[0.95rem] border border-[#D8E7F5] bg-[#F7FBFF] px-3 py-2"
                  >
                    <p className="text-[12px] font-semibold leading-5 text-foreground">{slot.label}</p>
                    <p className="admin-meta-text">{slot.count} bookings in period</p>
                  </div>
                ))}
              {!heatmap.slots.some((slot) => slot.count > 0) ? (
                <p className="admin-empty-copy">No booking activity in the current period.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 xl:hidden">
        <div className="min-w-0 rounded-[1.05rem] border border-border/70 bg-white px-3 py-3">
          <p className="admin-kicker-label">
            Period volume
          </p>
          <p className="mt-1 text-xl font-semibold leading-none tracking-[-0.03em] text-foreground">
            {heatmap.totalBookings}
          </p>
          <p className="admin-meta-text mt-1">{heatmap.periodLabel}</p>
        </div>

        <div className="min-w-0 rounded-[1.05rem] border border-border/70 bg-white px-3 py-3">
          <p className="admin-kicker-label">
            Busiest day
          </p>
          <p className="mt-1 text-[12px] font-semibold leading-5 text-foreground">
            {heatmap.busiestDay?.label || "-"}
          </p>
          <p className="admin-meta-text mt-1">
            {heatmap.busiestDay?.count || 0} bookings
          </p>
        </div>

        <div className="min-w-0 rounded-[1.05rem] border border-border/70 bg-white px-3 py-3">
          <p className="admin-kicker-label">
            Busy times
          </p>
          <div className="mt-2 space-y-1.5">
            {sortedBusySlots.length ? (
              sortedBusySlots.map((slot) => (
                <div key={slot.value} className="rounded-[0.85rem] border border-[#D8E7F5] bg-[#F7FBFF] px-2.5 py-2">
                  <p className="truncate text-[11px] font-semibold leading-4 text-foreground">{slot.label}</p>
                  <p className="admin-meta-text">{slot.count} bookings</p>
                </div>
              ))
            ) : (
              <p className="admin-meta-text">No activity.</p>
            )}
          </div>
        </div>

        <div className="min-w-0 rounded-[1.05rem] border border-border/70 bg-white px-3 py-3">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <p className="admin-kicker-label">
              Slot load
            </p>
            <p className="admin-meta-text">
              Peak {heatmap.busiestSlot?.label || "-"}
            </p>
          </div>

          <div className="mt-2 space-y-1.5">
            {heatmap.slots.map((slot) => {
              const width =
                heatmap.totalBookings > 0
                  ? Math.max((slot.count / heatmap.totalBookings) * 100, slot.count ? 12 : 0)
                  : 0;

              return (
                <div
                  key={slot.value}
                  className="min-w-0 rounded-[0.85rem] border border-[#D8E7F5] bg-[#F7FBFF] px-2.5 py-2"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="min-w-0 truncate font-semibold text-foreground">{slot.label}</span>
                    <span className="text-muted-foreground">{slot.count}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-[#EAF4FF]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: getSlotLoadBarColor(slot.count, heatmap.busiestSlot?.count || 0),
                        width: `${Math.min(width, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="hidden min-w-0 rounded-[1.15rem] border border-border/70 bg-white px-4 py-2.5 xl:block">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="admin-kicker-label">
            Slot load
          </p>
          <p className="admin-meta-text">
            Peak {heatmap.busiestSlot?.label || "-"}
          </p>
        </div>

        <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {heatmap.slots.map((slot) => {
            const width =
              heatmap.totalBookings > 0
                ? Math.max((slot.count / heatmap.totalBookings) * 100, slot.count ? 12 : 0)
                : 0;

            return (
              <div
                key={slot.value}
                className="min-w-0 rounded-[0.95rem] border border-[#D8E7F5] bg-[#F7FBFF] px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate font-semibold text-foreground">{slot.label}</span>
                  <span className="text-muted-foreground">{slot.count}</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-[#EAF4FF]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: getSlotLoadBarColor(slot.count, heatmap.busiestSlot?.count || 0),
                      width: `${Math.min(width, 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
