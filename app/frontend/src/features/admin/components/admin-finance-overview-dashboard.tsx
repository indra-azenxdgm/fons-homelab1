"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowDownRight, ArrowUpRight, CircleDollarSign, CreditCard, ReceiptText, Wallet } from "lucide-react";

import type { AdminFinanceOverview, FinanceOverviewPeriod } from "@/features/admin/lib/shared/admin-finance-overview-types";
import {
  getExpenseCategoryColor,
  formatFinanceDate,
  getPaymentMethodColor,
  formatRupiah,
} from "@/features/admin/lib/shared/admin-finance";
import { cn } from "@/lib/utils";

type AdminFinanceOverviewDashboardProps = {
  overview: AdminFinanceOverview;
  activePeriod: FinanceOverviewPeriod;
};

function formatCompactRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function formatSignedRupiah(amount: number) {
  if (amount < 0) {
    return `-${formatRupiah(Math.abs(amount))}`;
  }

  return formatRupiah(amount);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDelta(delta: number | null) {
  if (delta === null) {
    return "No comparison yet";
  }

  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}% vs previous`;
}

function getDeltaTone(delta: number | null, inverse = false) {
  if (delta === null || delta === 0) {
    return "text-muted-foreground";
  }

  const positive = inverse ? delta < 0 : delta > 0;
  return positive ? "text-emerald-700" : "text-rose-700";
}

function getTransactionTypeClassName(type: "INCOME" | "EXPENSE") {
  return type === "INCOME"
    ? "border-emerald-200/90 bg-emerald-50 text-emerald-800"
    : "border-orange-200/90 bg-orange-50 text-orange-800";
}

function NoDataState({ copy }: { copy: string }) {
  return (
    <div className="flex min-h-[16rem] items-center justify-center rounded-[1.2rem] border border-dashed border-border/70 bg-muted/15 px-4 text-center text-[12px] leading-5 text-muted-foreground">
      {copy}
    </div>
  );
}

function FinanceOverviewTrendChart({ points }: { points: AdminFinanceOverview["trend"]["points"] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activePoint = activeIndex === null ? null : points[activeIndex];
  const width = 760;
  const height = 300;
  const padding = { top: 24, right: 24, bottom: 48, left: 52 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const allValues = points.flatMap((point) => [point.income, point.expenses, point.net]);
  const minValue = Math.min(0, ...allValues);
  const maxValue = Math.max(0, ...allValues, 1);
  const domain = maxValue - minValue || 1;
  const zeroY = padding.top + ((maxValue - 0) / domain) * chartHeight;
  const groupWidth = chartWidth / Math.max(points.length, 1);
  const barWidth = Math.min(18, groupWidth * 0.22);
  const labelStep = points.length > 10 ? 3 : points.length > 7 ? 2 : 1;

  const toY = (value: number) => padding.top + ((maxValue - value) / domain) * chartHeight;

  const createSmoothPath = (values: number[]) =>
    values
      .map((value, index, source) => {
        const x = padding.left + groupWidth * index + groupWidth / 2;
        const y = toY(value);

        if (index === 0) {
          return `M${x},${y}`;
        }

        const previousX = padding.left + groupWidth * (index - 1) + groupWidth / 2;
        const previousY = toY(source[index - 1]);
        const controlX = previousX + (x - previousX) / 2;

        return `C${controlX},${previousY} ${controlX},${y} ${x},${y}`;
      })
      .join(" ");

  const linePath = createSmoothPath(points.map((point) => point.net));

  const hasData = points.some((point) => point.income > 0 || point.expenses > 0 || point.net !== 0);

  if (!hasData) {
    return <NoDataState copy="No income or expense trend is available for the selected period." />;
  }

  return (
    <div className="relative touch-pan-x lg:pt-1">
      {activePoint ? (
        <div
          className="pointer-events-none absolute top-1.5 z-10 min-w-[9.5rem] rounded-[0.95rem] border border-slate-200/90 bg-white/97 px-3 py-2 text-[10px] shadow-[0_20px_38px_-24px_rgba(15,23,42,0.28)] backdrop-blur-sm transition-all duration-200 sm:top-2 sm:min-w-[11rem] sm:px-3.5 sm:py-2.5 sm:text-[11px] lg:min-w-[12rem] lg:px-4 lg:py-3"
          style={{
            left: `${Math.min(Math.max(((activeIndex ?? 0) + 0.5) / points.length * 100, 16), 84)}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-semibold text-foreground">{activePoint.label}</p>
          <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            <span className="text-slate-500">Income</span>
            <span className="text-right font-medium text-emerald-700">{formatRupiah(activePoint.income)}</span>
            <span className="text-slate-500">Expenses</span>
            <span className="text-right font-medium text-orange-700">{formatRupiah(activePoint.expenses)}</span>
            <span className="text-slate-500">Net Profit</span>
            <span className={cn("text-right font-semibold", activePoint.net < 0 ? "text-rose-700" : "text-sky-700")}>
              {formatSignedRupiah(activePoint.net)}
            </span>
          </div>
        </div>
      ) : null}

      <svg viewBox={`0 0 ${width} ${height}`} className="h-[14.75rem] w-full sm:h-[19rem] lg:h-[21.5rem]">
        <defs>
          <linearGradient id="finance-net-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
          <filter id="finance-trend-soft-shadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="rgba(14,165,233,0.12)" />
          </filter>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((step) => {
          const value = maxValue - domain * step;
          const y = padding.top + chartHeight * step;

          return (
            <g key={step}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="rgba(148,163,184,0.1)" strokeDasharray="3 7" />
              <text x={padding.left - 12} y={y + 4} textAnchor="end" className="fill-slate-400 text-[8px] sm:text-[10px]">
                {Math.round(value / 1000)}k
              </text>
            </g>
          );
        })}

        <line x1={padding.left} x2={width - padding.right} y1={zeroY} y2={zeroY} stroke="rgba(15,23,42,0.2)" />

        {points.map((point, index) => {
          const groupX = padding.left + groupWidth * index;
          const incomeHeight = Math.max(0, zeroY - toY(point.income));
          const expenseHeight = Math.max(0, zeroY - toY(point.expenses));
          const incomeY = zeroY - incomeHeight;
          const expenseY = zeroY - expenseHeight;

          return (
            <g key={point.key}>
              <rect
                x={groupX + groupWidth * 0.18}
                y={incomeY}
                width={barWidth}
                height={incomeHeight}
                rx={10}
                fill="#22c55e"
                className="transition-all duration-200"
              />
              <rect
                x={groupX + groupWidth * 0.52}
                y={expenseY}
                width={barWidth}
                height={expenseHeight}
                rx={10}
                fill="#fb923c"
                className="transition-all duration-200"
              />
              {index % labelStep === 0 || index === points.length - 1 ? (
                <text x={groupX + groupWidth / 2} y={height - 16} textAnchor="middle" className="fill-slate-500 text-[8px] sm:text-[10px]">
                  {point.label}
                </text>
              ) : null}
              <rect
                x={groupX + 4}
                y={padding.top}
                width={groupWidth - 8}
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex((current) => (current === index ? null : current))}
                onPointerDown={() => setActiveIndex(index)}
              />
            </g>
          );
        })}

        <path d={`${linePath} L${padding.left + groupWidth * (points.length - 1) + groupWidth / 2},${zeroY} L${padding.left + groupWidth / 2},${zeroY} Z`} fill="url(#finance-net-fill)" />
        <path d={linePath} fill="none" stroke="#0284c7" strokeWidth="3.25" strokeLinecap="round" strokeLinejoin="round" filter="url(#finance-trend-soft-shadow)" />

        {points.map((point, index) => {
          const x = padding.left + groupWidth * index + groupWidth / 2;
          const y = toY(point.net);

          return (
            <circle
              key={`${point.key}-net`}
              cx={x}
              cy={y}
              r={activeIndex === index ? 5 : 4}
              fill="#0284c7"
              stroke="white"
              strokeWidth="2"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex((current) => (current === index ? null : current))}
              onPointerDown={() => setActiveIndex(index)}
            />
          );
        })}
      </svg>

      <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] sm:mt-3 sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:text-[11px] lg:mt-4 lg:gap-2.5">
        <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/75 px-2.5 py-1.5 text-emerald-700 transition-colors sm:justify-start sm:py-1">
          <span className="size-2 rounded-full bg-emerald-500" />
          Income
        </span>
        <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-orange-100 bg-orange-50/75 px-2.5 py-1.5 text-orange-700 transition-colors sm:justify-start sm:py-1">
          <span className="size-2 rounded-full bg-orange-400" />
          Expenses
        </span>
        <span className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-full border border-sky-100 bg-sky-50/75 px-2.5 py-1.5 text-sky-700 transition-colors sm:col-auto sm:justify-start sm:py-1">
          <span className="size-2 rounded-full bg-sky-600" />
          Net Profit
        </span>
      </div>
    </div>
  );
}

function FinanceOverviewDonutChart({
  items,
  emptyCopy,
  getColor,
}: {
  items: Array<{ key: string; label: string; total: number; percentage: number }>;
  emptyCopy: string;
  getColor: (key: string, label: string) => string;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const normalizedItems = items.map((item) => ({
    ...item,
    color: getColor(item.key, item.label),
  }));
  const total = normalizedItems.reduce((sum, item) => sum + item.total, 0);
  const radius = 52;
  const strokeWidth = 14;
  const center = 80;
  const trackColor = "#E6EDF3";
  const circumference = 2 * Math.PI * radius;

  if (!normalizedItems.length || total <= 0) {
    return <NoDataState copy={emptyCopy} />;
  }

  const segments = normalizedItems.reduce<Array<{ key: string; label: string; total: number; color: string; dasharray: string; dashoffset: number }>>((accumulator, item) => {
    const previousOffset = accumulator.at(-1)?.dashoffset ?? 0;
    const previousTotal = accumulator.at(-1)?.total ?? 0;
    const segmentLength = (item.total / total) * circumference;
    const dashoffset =
      accumulator.length === 0
        ? 0
        : previousOffset - (previousTotal / total) * circumference;

    accumulator.push({
      key: item.key,
      label: item.label,
      total: item.total,
      color: item.color,
      dasharray: `${segmentLength} ${circumference - segmentLength}`,
      dashoffset,
    });

    return accumulator;
  }, []);

  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-[15.25rem_minmax(0,1fr)] lg:items-center lg:gap-5">
      <div className="mx-auto flex aspect-square w-[8.75rem] items-center justify-center sm:w-[10rem] lg:w-[11.25rem]">
        <svg viewBox="0 0 160 160" className="block size-full">
          <circle cx={center} cy={center} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
          {segments.map((item) => {
            return (
              <circle
                key={item.key}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                strokeDasharray={item.dasharray}
                strokeDashoffset={item.dashoffset}
                transform={`rotate(-90 ${center} ${center})`}
                className={cn("transition-opacity duration-150", activeKey === item.key ? "opacity-100" : "opacity-95")}
                onMouseEnter={() => setActiveKey(item.key)}
                onMouseLeave={() => setActiveKey(null)}
                onPointerLeave={() => setActiveKey(null)}
              />
            );
          })}
          <circle cx={center} cy={center} r="37" fill="#ffffff" />
          <text x="80" y="72" textAnchor="middle" className="fill-slate-400 text-[7px] uppercase tracking-[0.22em]">
            Total
          </text>
          <text x="80" y="91" textAnchor="middle" className="fill-slate-900 text-[12px] font-semibold">
            {formatCompactRupiah(total)}
          </text>
        </svg>
      </div>

      <div className="space-y-2 lg:space-y-2.5">
        {normalizedItems.map((item) => (
          <div
            key={item.key}
            className={cn(
              "flex items-center justify-between gap-2.5 rounded-[0.95rem] border border-border/70 bg-white/82 px-2.5 py-2 transition-all duration-200 sm:gap-3 sm:rounded-[1rem] sm:px-3 sm:py-2.5 lg:px-3.5 lg:py-3",
              activeKey === item.key ? "border-slate-200 bg-white shadow-[0_14px_24px_-24px_rgba(15,23,42,0.22)]" : "hover:border-slate-200 hover:bg-white",
            )}
            onMouseEnter={() => setActiveKey(item.key)}
            onMouseLeave={() => setActiveKey(null)}
            onPointerDown={() => setActiveKey(item.key)}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full ring-4 ring-white"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: `0 0 0 1px ${item.color}22`,
                  }}
                />
                <p className="truncate text-[12px] font-medium text-foreground lg:text-[12.5px]">{item.label}</p>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{item.percentage}% of selected period</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold text-foreground lg:text-[11.5px]">{formatRupiah(item.total)}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{formatPercent(item.percentage)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminFinanceOverviewDashboard({
  overview,
  activePeriod,
}: AdminFinanceOverviewDashboardProps) {
  const periodOptions: FinanceOverviewPeriod[] = ["7D", "30D", "3M", "12M"];
  const recentPaidBookings = overview.recentPaidBookings.slice(0, 4);

  return (
    <section className="space-y-3 sm:space-y-4 lg:space-y-5">
      <div className="flex justify-stretch sm:justify-end lg:pb-0.5">
        <div className="grid w-full grid-cols-4 items-center gap-1 rounded-full border border-slate-200/80 bg-white/92 p-1 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.2)] backdrop-blur-sm sm:inline-flex sm:w-fit sm:grid-cols-none lg:gap-1.5 lg:p-1.5">
          {periodOptions.map((option) => (
            <Link
              key={option}
              href={`/admin/finance/overview?period=${option}`}
              className={cn(
                "inline-flex h-9 min-w-0 items-center justify-center rounded-full px-2.5 text-[11px] font-medium transition-all duration-200 active:scale-[0.98] sm:h-8 sm:min-w-11 sm:px-3 lg:h-9 lg:min-w-12 lg:px-3.5 lg:text-[11.5px]",
                activePeriod === option
                  ? "bg-primary text-primary-foreground shadow-[0_12px_24px_-18px_rgba(15,23,42,0.45)]"
                  : "text-muted-foreground hover:bg-slate-50 hover:text-foreground",
              )}
            >
              {option}
            </Link>
          ))}
        </div>
      </div>

      <section className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4 lg:gap-4">
        {[
          {
            key: "income",
            label: "Total Income",
            value: overview.kpis.totalIncome.value,
            delta: overview.kpis.totalIncome.delta,
            tone: "text-emerald-700",
            chipClassName: "border-emerald-200/90 bg-emerald-50 text-emerald-700",
            icon: CircleDollarSign,
          },
          {
            key: "expenses",
            label: "Total Expenses",
            value: overview.kpis.totalExpenses.value,
            delta: overview.kpis.totalExpenses.delta,
            tone: "text-orange-700",
            chipClassName: "border-orange-200/90 bg-orange-50 text-orange-700",
            icon: CreditCard,
            inverse: true,
          },
          {
            key: "net",
            label: "Net Profit",
            value: overview.kpis.netProfit.value,
            delta: overview.kpis.netProfit.delta,
            tone: overview.kpis.netProfit.value < 0 ? "text-rose-700" : "text-sky-700",
            chipClassName: overview.kpis.netProfit.value < 0
              ? "border-rose-200/90 bg-rose-50 text-rose-700"
              : "border-sky-200/90 bg-sky-50 text-sky-700",
            icon: Wallet,
            formatter: (value: number) => formatSignedRupiah(value),
          },
          {
            key: "unpaid",
            label: "Unpaid Completed Bookings",
            value: overview.kpis.unpaidCompletedBookings.value,
            delta: overview.kpis.unpaidCompletedBookings.delta,
            tone: "text-amber-700",
            chipClassName: "border-amber-200/90 bg-amber-50 text-amber-700",
            icon: ReceiptText,
            inverse: true,
            formatter: (value: number) => `${value}`,
          },
        ].map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.key} className="rounded-[1.3rem] border border-border/70 bg-white/92 p-3.5 shadow-[0_18px_34px_-30px_rgba(15,23,42,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_42px_-30px_rgba(15,23,42,0.2)] sm:rounded-[1.45rem] sm:p-4 lg:min-h-[10.2rem] lg:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="admin-kicker-label">{card.label}</p>
                  <p className={cn("mt-1.5 text-[1.34rem] font-semibold tracking-[-0.05em] sm:mt-2 sm:text-[1.6rem] lg:mt-2.5 lg:text-[1.78rem]", card.key === "net" ? card.tone : "text-foreground")}>
                    {card.formatter ? card.formatter(card.value) : formatRupiah(card.value)}
                  </p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-muted-foreground sm:text-[10px] lg:mt-1.5">Selected period</p>
                </div>
                <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-[0.95rem] border shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] sm:size-10 sm:rounded-[1rem] lg:size-11", card.chipClassName)}>
                  <Icon className="size-3.5 sm:size-4 lg:size-[1.05rem]" />
                </span>
              </div>
              <div className={cn("mt-3 inline-flex items-center gap-1 rounded-full px-0.5 text-[10px] font-medium sm:mt-4 sm:text-[11px] lg:mt-5", getDeltaTone(card.delta, card.inverse))}>
                {card.delta === null ? null : (card.inverse ? card.delta <= 0 : card.delta >= 0) ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                <span className={card.delta === null ? "text-muted-foreground" : ""}>{formatDelta(card.delta)}</span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.62fr)_minmax(19rem,0.88fr)] lg:items-stretch lg:gap-5">
        <article className="rounded-[1.35rem] border border-border/70 bg-white/94 p-3.5 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.18)] transition-all duration-200 hover:shadow-[0_24px_46px_-34px_rgba(15,23,42,0.2)] sm:rounded-[1.55rem] sm:p-5 lg:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="admin-section-title">Income vs Expenses Trend</p>
              <p className="admin-section-copy">{overview.periodLabel}</p>
            </div>
          </div>
          <div className="mt-3.5 sm:mt-4">
            <FinanceOverviewTrendChart points={overview.trend.points} />
          </div>
        </article>

        <article className="rounded-[1.35rem] border border-border/70 bg-white/94 p-3.5 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.18)] transition-all duration-200 hover:shadow-[0_24px_46px_-34px_rgba(15,23,42,0.2)] sm:rounded-[1.55rem] sm:p-5 lg:p-6">
          <div>
            <p className="admin-section-title">Finance Snapshot</p>
            <p className="admin-section-copy">{overview.periodLabel}</p>
          </div>

          <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3 lg:space-y-3.5">
            {[
              { label: "Total Income", value: formatRupiah(overview.snapshot.totalIncome), tone: "text-emerald-700" },
              { label: "Total Expenses", value: formatRupiah(overview.snapshot.totalExpenses), tone: "text-orange-700" },
              { label: "Net Profit Margin", value: `${overview.snapshot.netProfitMargin}%`, tone: "text-sky-700" },
              { label: "Average Income per Paid Booking", value: formatRupiah(overview.snapshot.averageIncomePerPaidBooking), tone: "text-foreground" },
            ].map((item) => (
              <div key={item.label} className="rounded-[1rem] border border-border/70 bg-muted/18 px-3 py-2.5 sm:rounded-[1.1rem] sm:px-3.5 sm:py-3 lg:px-4 lg:py-3.5">
                <p className="text-[11px] text-muted-foreground">{item.label}</p>
                <p className={cn("mt-1 text-[1.05rem] font-semibold tracking-[-0.04em] sm:text-[1.1rem] lg:text-[1.18rem]", item.tone)}>{item.value}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-3 sm:gap-4 xl:grid-cols-2 lg:gap-5">
        <article className="rounded-[1.35rem] border border-border/70 bg-white/94 p-3.5 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.18)] transition-all duration-200 hover:shadow-[0_24px_46px_-34px_rgba(15,23,42,0.2)] sm:rounded-[1.55rem] sm:p-5 lg:p-6">
          <div>
            <p className="admin-section-title">Expense Breakdown by Category</p>
            <p className="admin-section-copy">{overview.periodLabel}</p>
          </div>
          <div className="mt-3 sm:mt-4">
            <FinanceOverviewDonutChart
              items={overview.expenseBreakdown}
              emptyCopy="No expense category data is available for the selected period."
              getColor={(key, label) => getExpenseCategoryColor(key || label)}
            />
          </div>
        </article>

        <article className="rounded-[1.35rem] border border-border/70 bg-white/94 p-3.5 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.18)] transition-all duration-200 hover:shadow-[0_24px_46px_-34px_rgba(15,23,42,0.2)] sm:rounded-[1.55rem] sm:p-5 lg:p-6">
          <div>
            <p className="admin-section-title">Income Breakdown by Payment Method</p>
            <p className="admin-section-copy">{overview.periodLabel}</p>
          </div>
          <div className="mt-3 sm:mt-4">
            <FinanceOverviewDonutChart
              items={overview.incomePaymentBreakdown}
              emptyCopy="No income payment method data is available for the selected period."
              getColor={(_key, label) => getPaymentMethodColor(label)}
            />
          </div>
        </article>
      </section>

      <article className="rounded-[1.35rem] border border-border/70 bg-white/94 p-3.5 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.18)] transition-all duration-200 hover:shadow-[0_24px_46px_-34px_rgba(15,23,42,0.2)] sm:rounded-[1.55rem] sm:p-5 lg:p-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="admin-section-title">Booking Revenue Status</p>
            <p className="admin-section-copy">Completed bookings include both `Completed` and `Paid` status snapshots.</p>
          </div>
          <p className="text-[12px] font-medium text-sky-700 lg:text-[12.5px]">{formatPercent(overview.bookingRevenueStatus.paidConversionRate)} paid conversion</p>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2.5 lg:mt-4 lg:grid-cols-4 lg:gap-3">
          {[
            { label: "Completed Bookings", value: overview.bookingRevenueStatus.completedBookings, tone: "text-foreground", block: "border-slate-200/80 bg-slate-50/70" },
            { label: "Paid Bookings", value: overview.bookingRevenueStatus.paidBookings, tone: "text-emerald-700", block: "border-emerald-100 bg-emerald-50/70" },
            { label: "Unpaid Completed Bookings", value: overview.bookingRevenueStatus.unpaidCompletedBookings, tone: "text-amber-700", block: "border-amber-100 bg-amber-50/75" },
            { label: "Paid Conversion Rate", value: formatPercent(overview.bookingRevenueStatus.paidConversionRate), tone: "text-sky-700", block: "border-sky-100 bg-sky-50/70" },
          ].map((item) => (
            <div key={item.label} className={cn("rounded-[1rem] border px-2.5 py-2.5 sm:rounded-[1.1rem] sm:px-3.5 sm:py-3", item.block)}>
              <p className="text-[10px] text-muted-foreground sm:text-[11px]">{item.label}</p>
              <p className={cn("mt-1 text-[1rem] font-semibold tracking-[-0.04em] sm:text-[1.15rem]", item.tone)}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3.5 space-y-2 lg:mt-4 lg:space-y-2.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground sm:text-[11px] lg:text-[11.5px]">
            <span>Revenue conversion</span>
            <span>{overview.bookingRevenueStatus.paidBookings} / {Math.max(overview.bookingRevenueStatus.completedBookings, 0)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 sm:h-3 lg:h-3.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-300"
              style={{ width: `${Math.min(overview.bookingRevenueStatus.paidConversionRate, 100)}%` }}
            />
          </div>
        </div>
      </article>

      <section className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.34fr)_minmax(0,0.86fr)] lg:items-start lg:gap-5">
        <article className="min-w-0 overflow-hidden rounded-[1.35rem] border border-border/70 bg-white/94 p-3.5 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.18)] transition-all duration-200 hover:shadow-[0_24px_46px_-34px_rgba(15,23,42,0.2)] sm:rounded-[1.55rem] sm:p-5 lg:p-6">
          <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
            <div className="min-w-0">
              <p className="admin-section-title">Recent Transactions</p>
              <p className="admin-section-copy">Latest income and expense activity inside the selected period.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <Link href="/admin/finance/income" className="text-primary transition hover:text-primary/80">View all income</Link>
              <Link href="/admin/finance/expenses" className="text-primary transition hover:text-primary/80">View all expenses</Link>
            </div>
          </div>

          {overview.recentTransactions.length ? (
            <>
              <div className="mt-3 grid gap-2 md:hidden">
                {overview.recentTransactions.map((item) => (
                  <div key={item.id} className="rounded-[0.95rem] border border-border/70 bg-muted/18 px-2.5 py-2.5 transition-colors hover:bg-muted/24">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[9px] font-medium", getTransactionTypeClassName(item.type))}>
                            {item.type === "INCOME" ? "Income" : "Expense"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{formatFinanceDate(item.date)}</span>
                        </div>
                        <p className="mt-1.5 truncate text-[12px] font-semibold text-foreground">{item.name}</p>
                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{item.reference || "-"}</p>
                        <p className="mt-1 truncate text-[10px] text-muted-foreground">{item.meta}</p>
                      </div>
                      <p className={cn("shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold", item.type === "INCOME" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700")}>
                        {item.type === "INCOME" ? "+" : "-"}{formatRupiah(item.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="min-w-full text-left text-[11px] leading-4 lg:text-[11.5px]">
                  <thead className="bg-muted/30 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5 font-medium lg:px-3.5">Date</th>
                      <th className="px-3 py-2.5 font-medium lg:px-3.5">Type</th>
                      <th className="px-3 py-2.5 font-medium lg:px-3.5">Reference</th>
                      <th className="px-3 py-2.5 font-medium lg:px-3.5">Name / Description</th>
                      <th className="px-3 py-2.5 font-medium lg:px-3.5">Amount</th>
                      <th className="px-3 py-2.5 font-medium lg:px-3.5">Method / Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recentTransactions.map((item) => (
                      <tr key={item.id} className="border-t border-border/70 transition-colors hover:bg-muted/18">
                        <td className="px-3 py-2.5 lg:px-3.5">{formatFinanceDate(item.date)}</td>
                        <td className="px-3 py-2.5 lg:px-3.5">
                          <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[9px] font-medium", getTransactionTypeClassName(item.type))}>
                            {item.type === "INCOME" ? "Income" : "Expense"}
                          </span>
                        </td>
                        <td className="max-w-[10rem] px-3 py-2.5 text-muted-foreground lg:max-w-[12rem] lg:px-3.5"><span className="block truncate">{item.reference || "-"}</span></td>
                        <td className="max-w-[18rem] px-3 py-2.5 lg:max-w-[22rem] lg:px-3.5"><span className="block truncate font-medium text-foreground">{item.name}</span></td>
                        <td className={cn("px-3 py-2.5 font-semibold lg:px-3.5", item.type === "INCOME" ? "text-emerald-700" : "text-orange-700")}>
                          {item.type === "INCOME" ? "+" : "-"}{formatRupiah(item.amount)}
                        </td>
                        <td className="max-w-[12rem] px-3 py-2.5 text-muted-foreground lg:max-w-[14rem] lg:px-3.5"><span className="block truncate">{item.meta}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="mt-4">
              <NoDataState copy="No recent finance transactions are available for the selected period." />
            </div>
          )}
        </article>

        <article className="min-w-0 overflow-hidden rounded-[1.35rem] border border-border/70 bg-white/94 p-3.5 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.18)] transition-all duration-200 hover:shadow-[0_24px_46px_-34px_rgba(15,23,42,0.2)] sm:rounded-[1.55rem] sm:p-5 lg:p-6">
          <div className="min-w-0">
            <p className="admin-section-title">Recent Paid Bookings</p>
            <p className="admin-section-copy">Latest bookings already moved to `Paid` inside the selected period.</p>
          </div>

          {recentPaidBookings.length ? (
            <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5 lg:space-y-3">
              {recentPaidBookings.map((booking) => (
                <div key={booking.id} className="rounded-[0.95rem] border border-border/70 bg-muted/18 px-2.5 py-2.5 transition-colors hover:bg-muted/24 sm:rounded-[1.1rem] sm:px-3.5 sm:py-3 lg:px-4 lg:py-3.5">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-foreground lg:text-[12.5px]">{booking.bookingCode}</p>
                      <p className="truncate text-[10px] text-muted-foreground sm:text-[11px]">{booking.customer}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50/80 px-2 py-1 text-[9px] font-medium text-emerald-700">
                      {formatFinanceDate(booking.paidDate)}
                    </span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] lg:gap-2.5">
                    <div className="rounded-[0.9rem] border border-slate-200/80 bg-white/86 px-2.5 py-2 sm:rounded-[0.95rem] sm:px-3 lg:px-3.5 lg:py-2.5">
                      <p className="text-muted-foreground">Total Items</p>
                      <p className="mt-1 font-semibold text-foreground">{booking.totalItems}</p>
                    </div>
                    <div className="rounded-[0.9rem] border border-emerald-100 bg-emerald-50/70 px-2.5 py-2 sm:rounded-[0.95rem] sm:px-3 lg:px-3.5 lg:py-2.5">
                      <p className="text-muted-foreground">Total Amount</p>
                      <p className="mt-1 font-semibold text-emerald-700">{formatRupiah(booking.totalAmount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <NoDataState copy="No paid bookings are available for the selected period." />
            </div>
          )}
        </article>
      </section>
    </section>
  );
}
