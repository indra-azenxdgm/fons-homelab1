"use client";

import { forwardRef, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DateInputControlProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

type PickerInput = HTMLInputElement & {
  showPicker?: () => void;
};

function openDatePicker(input: PickerInput | null) {
  if (!input) {
    return;
  }

  input.focus();

  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
      return;
    } catch {
      // Fall back to the browser default click behavior below.
    }
  }

  input.click();
}

function parseDateValue(value?: string | number | readonly string[] | null) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatInputDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function clampDate(
  date: Date,
  min?: string | number | readonly string[] | null,
  max?: string | number | readonly string[] | null,
) {
  const minDate = parseDateValue(min);
  const maxDate = parseDateValue(max);

  if (minDate && date < minDate) {
    return minDate;
  }

  if (maxDate && date > maxDate) {
    return maxDate;
  }

  return date;
}

function assignRef<T>(
  ref: React.Ref<T> | undefined,
  value: T,
) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }

  if (ref && "current" in ref) {
    ref.current = value;
  }
}

function updateInputValue(input: PickerInput | null, value: string) {
  if (!input) {
    return;
  }

  const descriptor = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  );

  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export const DateInputControl = forwardRef<HTMLInputElement, DateInputControlProps>(
function DateInputControl(
  {
    className,
    onClick,
    value,
    defaultValue,
    min,
    max,
    ...props
  },
  forwardedRef,
) {
  const inputRef = useRef<PickerInput | null>(null);
  const selectedDate = useMemo(
    () =>
      parseDateValue(value) ||
      parseDateValue(defaultValue) ||
      parseDateValue(min) ||
      new Date(),
    [defaultValue, min, value],
  );
  const visibleDate = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
      }).format(selectedDate),
    [selectedDate],
  );
  const dateStrip = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(selectedDate, index - 3);

        return {
          key: formatInputDate(date),
          value: date,
          weekday: new Intl.DateTimeFormat("id-ID", {
            weekday: "short",
          }).format(date),
          day: new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
          }).format(date),
        };
      }),
    [selectedDate],
  );

  function setInputRef(node: PickerInput | null) {
    inputRef.current = node;
    assignRef(forwardedRef, node);
  }

  function selectDate(date: Date) {
    updateInputValue(inputRef.current, formatInputDate(clampDate(date, min, max)));
  }

  function shiftDate(amount: number) {
    selectDate(addDays(selectedDate, amount));
  }

  return (
    <div className={cn("relative", className)}>
      <input
        {...props}
        ref={setInputRef}
        type="date"
        value={value}
        defaultValue={defaultValue}
        min={min}
        max={max}
        className="sr-only"
        onClick={(event) => {
          onClick?.(event);
          openDatePicker(inputRef.current);
        }}
      />
      <div
        className="rounded-[1.55rem] border border-border bg-white px-4 py-4 shadow-[0_12px_22px_-22px_rgba(0,81,162,0.1)]"
        onClick={() => openDatePicker(inputRef.current)}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[1.05rem] font-medium leading-6 tracking-[-0.015em] text-foreground">
              {visibleDate}
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
              Ketuk kartu ini untuk memilih tanggal
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Tanggal sebelumnya"
              className="h-7 w-7 rounded-full text-muted-foreground hover:bg-secondary hover:text-primary"
              onClick={(event) => {
                event.stopPropagation();
                shiftDate(-1);
              }}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Tanggal berikutnya"
              className="h-7 w-7 rounded-full text-muted-foreground hover:bg-secondary hover:text-primary"
              onClick={(event) => {
                event.stopPropagation();
                shiftDate(1);
              }}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {dateStrip.map((item) => {
            const active = item.key === formatInputDate(selectedDate);

            return (
              <button
                key={item.key}
                type="button"
                className={cn(
                  "flex min-h-[72px] flex-col items-center justify-center rounded-[1.15rem] px-1 py-2 text-center transition",
                  active
                    ? "border border-primary bg-primary text-white shadow-[0_12px_20px_-18px_rgba(0,81,162,0.26)]"
                    : "border border-transparent text-foreground/86 hover:bg-secondary",
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  selectDate(item.value);
                }}
              >
                <span
                  className={cn(
                    "text-[11px] leading-4",
                    active ? "text-white/82" : "text-muted-foreground",
                  )}
                >
                  {item.weekday}
                </span>
                <span className="mt-2 text-[1.05rem] font-medium leading-5">
                  {item.day}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

DateInputControl.displayName = "DateInputControl";
