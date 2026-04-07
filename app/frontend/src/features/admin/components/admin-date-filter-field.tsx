"use client";

import { useRef } from "react";
import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";

type PickerInput = HTMLInputElement & {
  showPicker?: () => void;
};

type AdminDateFilterFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

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
      // Fall back to native click behavior when showPicker is unavailable.
    }
  }

  input.click();
}

export function AdminDateFilterField({
  className,
  onClick,
  ...props
}: AdminDateFilterFieldProps) {
  const inputRef = useRef<PickerInput | null>(null);

  return (
    <div
      className={cn(
        "relative flex h-8 w-full items-center rounded-[1rem] border border-border bg-background transition focus-within:border-primary",
        className,
      )}
      onClick={() => openDatePicker(inputRef.current)}
    >
      <input
        {...props}
        ref={inputRef}
        type="date"
        className="date-input-clean h-full w-full rounded-[1rem] bg-transparent px-2.5 pr-8 text-[11px] leading-4 outline-none"
        onClick={(event) => {
          onClick?.(event);
          openDatePicker(inputRef.current);
        }}
      />
      <span className="pointer-events-none absolute right-2.5 inline-flex items-center justify-center text-muted-foreground">
        <CalendarDays className="size-3.5" />
      </span>
    </div>
  );
}
