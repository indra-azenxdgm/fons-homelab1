import { cn } from "@/lib/utils";

type Slot = {
  value: string;
  label: string;
  available: boolean;
};

type SlotPickerProps = {
  slots: Slot[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function SlotPicker({
  slots,
  value,
  onChange,
  disabled = false,
}: SlotPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {slots.map((slot) => {
        const active = slot.value === value;

        return (
          <button
            key={slot.value}
            type="button"
            aria-pressed={active}
            disabled={disabled || !slot.available}
            onClick={() => onChange(slot.value)}
            className={cn(
              "relative overflow-hidden rounded-[1.45rem] border px-4 py-3 text-left transition duration-200",
              slot.available
                ? "border-border bg-white text-foreground shadow-[0_10px_18px_-20px_rgba(0,81,162,0.1)]"
                : "cursor-not-allowed border-border bg-muted/55 text-muted-foreground",
              active &&
                "border-primary bg-secondary text-foreground shadow-[0_12px_20px_-20px_rgba(0,81,162,0.16)]",
              !active &&
                slot.available &&
                "hover:-translate-y-0.5 hover:border-[color:var(--border-strong)] hover:bg-white",
              disabled && "opacity-80",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[14px] font-medium leading-5 tracking-[-0.01em]">
                {slot.label}
              </p>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-medium leading-none",
                  active
                    ? "bg-[#d6e9ff] text-primary"
                    : slot.available
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-white text-muted-foreground",
                )}
              >
                {slot.available ? "Tersedia" : "Penuh"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
