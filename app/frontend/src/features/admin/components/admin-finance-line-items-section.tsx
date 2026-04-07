"use client";

import { useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";

import { financeDrawerSecondaryButtonClassName } from "@/features/admin/components/admin-finance-drawer-styles";
import type {
  FinanceLineItemFieldError,
  FinanceLineItemFormState,
} from "@/features/admin/lib/shared/admin-finance-line-items";
import { formatRupiah } from "@/features/admin/lib/shared/admin-finance";

const fieldClassName =
  "h-8 w-full rounded-[1rem] border border-border bg-background px-2.5 py-1.5 text-[11px] leading-4 outline-none transition focus:border-primary";

const fieldLabelClassName = "admin-kicker-label";

type AdminFinanceLineItemsSectionProps = {
  title: string;
  description: string;
  items: FinanceLineItemFormState[];
  errors: {
    items?: string;
    itemFields: FinanceLineItemFieldError[];
  };
  totalLabel: string;
  totalDescription: string;
  totalAmount: number;
  descriptionPlaceholder?: string;
  disabled?: boolean;
  onAdd: () => string;
  onRemove: (itemId: string) => void;
  onDescriptionChange: (itemId: string, value: string) => void;
  onAmountChange: (itemId: string, value: string) => void;
};

export function AdminFinanceLineItemsSection({
  title,
  description,
  items,
  errors,
  totalLabel,
  totalDescription,
  totalAmount,
  descriptionPlaceholder = "cleaning AC 1 unit",
  disabled = false,
  onAdd,
  onRemove,
  onDescriptionChange,
  onAmountChange,
}: AdminFinanceLineItemsSectionProps) {
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousItemIdsRef = useRef(items.map((item) => item.id));
  const descriptionInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const nextFocusRef = useRef<
    | { type: "new"; itemId: string }
    | { type: "remove"; itemId: string | null }
    | null
  >(null);

  useEffect(() => {
    const nextFocus = nextFocusRef.current;

    if (!nextFocus) {
      previousItemIdsRef.current = items.map((item) => item.id);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      if (nextFocus.type === "new") {
        descriptionInputRefs.current[nextFocus.itemId]?.focus({ preventScroll: true });
      } else if (nextFocus.itemId) {
        descriptionInputRefs.current[nextFocus.itemId]?.focus({ preventScroll: true });
      } else {
        addButtonRef.current?.focus({ preventScroll: true });
      }
    });

    previousItemIdsRef.current = items.map((item) => item.id);
    nextFocusRef.current = null;

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [items]);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="admin-kicker-label">{title}</p>
          <p className="text-[10px] leading-4 text-muted-foreground">{description}</p>
        </div>
        <button
          ref={addButtonRef}
          type="button"
          onClick={() => {
            const nextId = onAdd();
            nextFocusRef.current = { type: "new", itemId: nextId };
          }}
          disabled={disabled}
          className={financeDrawerSecondaryButtonClassName}
        >
          <Plus className="mr-1 size-3.5" />
          Add
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="rounded-[1rem] border border-border/70 bg-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold leading-4 text-foreground">Item {index + 1}</p>
              <button
                type="button"
                onClick={() => {
                  const nextItem = items[index + 1] || items[index - 1] || null;
                  nextFocusRef.current = {
                    type: "remove",
                    itemId: nextItem?.id || null,
                  };
                  onRemove(item.id);
                }}
                disabled={items.length <= 1 || disabled}
                className="inline-flex size-7 items-center justify-center rounded-full border border-border/80 text-muted-foreground transition hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
                aria-label={`Remove item ${index + 1}`}
                title="Remove item"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem]">
              <label className="grid gap-1.5">
                <span className={fieldLabelClassName}>Description</span>
                <input
                  ref={(node) => {
                    descriptionInputRefs.current[item.id] = node;
                  }}
                  value={item.description}
                  onChange={(event) => onDescriptionChange(item.id, event.target.value)}
                  placeholder={descriptionPlaceholder}
                  className={fieldClassName}
                  disabled={disabled}
                />
                {errors.itemFields[index]?.description ? <span className="text-[10px] text-destructive">{errors.itemFields[index]?.description}</span> : null}
              </label>

              <label className="grid gap-1.5">
                <span className={fieldLabelClassName}>Amount</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={item.amount}
                  onChange={(event) => onAmountChange(item.id, event.target.value)}
                  className={fieldClassName}
                  disabled={disabled}
                />
                {errors.itemFields[index]?.amount ? <span className="text-[10px] text-destructive">{errors.itemFields[index]?.amount}</span> : null}
              </label>
            </div>
          </div>
        ))}
      </div>

      {errors.items ? <span className="text-[10px] text-destructive">{errors.items}</span> : null}

      <div className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-white/75 px-3 py-2">
        <div>
          <p className="text-[11px] font-semibold leading-4 text-foreground">{totalLabel}</p>
          <p className="text-[10px] leading-4 text-muted-foreground">{totalDescription}</p>
        </div>
        <p className="text-[12px] font-semibold leading-4 text-foreground">{formatRupiah(totalAmount)}</p>
      </div>
    </section>
  );
}
