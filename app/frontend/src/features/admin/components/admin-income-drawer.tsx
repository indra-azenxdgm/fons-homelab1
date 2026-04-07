"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { Check, ChevronDown, LoaderCircle, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { pushAppToast } from "@/components/app-toast-viewport";
import { Button } from "@/components/ui/button";
import {
  BackendApiError,
  createIncomeBrowser,
  getFinanceBookingLookupBrowser,
  updateIncomeBrowser,
} from "@/features/admin/api/finance-browser-api";
import { AdminDrawer } from "@/features/admin/components/admin-drawer";
import { AdminFinanceLineItemsSection } from "@/features/admin/components/admin-finance-line-items-section";
import { financeDrawerPrimaryButtonClassName } from "@/features/admin/components/admin-finance-drawer-styles";
import { adminTableEditIconButtonClassName } from "@/features/admin/components/admin-table-actions";
import {
  createFinanceLineItem,
  getFinanceLineItemsTotal,
  hasFinanceLineItemErrors,
  normalizeFinanceLineItemsForSubmit,
  type FinanceLineItemFieldError,
  type FinanceLineItemFormState,
  validateFinanceLineItems,
} from "@/features/admin/lib/shared/admin-finance-line-items";
import { getFinancePaymentMethodLabel } from "@/features/admin/lib/shared/admin-finance";
import {
  financePaymentMethodOptions,
  type AdminFinanceBookingLookupItem,
  type AdminIncomeListItem,
  type FinancePaymentMethod,
} from "@/features/admin/lib/shared/admin-finance-types";
import { cn } from "@/lib/utils";

const fieldClassName =
  "h-8 w-full rounded-[1rem] border border-border bg-background px-2.5 py-1.5 text-[11px] leading-4 outline-none transition focus:border-primary";

const fieldLabelClassName = "admin-kicker-label";
const textareaClassName =
  "w-full rounded-[1rem] border border-border bg-background px-3 py-2 text-[11px] leading-4 outline-none transition focus:border-primary";

type IncomeFormState = {
  bookingId: string | null;
  bookingQuery: string;
  customerName: string;
  transactionDate: string;
  billNumber: string;
  paymentMethod: FinancePaymentMethod;
  notes: string;
  items: FinanceLineItemFormState[];
};

type IncomeFormErrors = {
  bookingQuery?: string;
  customerName?: string;
  transactionDate?: string;
  billNumber?: string;
  paymentMethod?: string;
  items?: string;
  itemFields: FinanceLineItemFieldError[];
};

type AdminIncomeDrawerProps = {
  bookingOptions: AdminFinanceBookingLookupItem[];
  income?: AdminIncomeListItem;
  iconOnly?: boolean;
};

function toDateInputValue(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function normalizeIncomeNotes(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function getBookingLabel(
  booking: Pick<AdminFinanceBookingLookupItem, "bookingCode" | "contactName">,
) {
  return `${booking.bookingCode} - ${booking.contactName}`;
}

function createInitialState(income?: AdminIncomeListItem): IncomeFormState {
  return {
    bookingId: income?.bookingId || null,
    bookingQuery: income?.bookingCode
      ? `${income.bookingCode} - ${income.customerName}`
      : "",
    customerName: income?.customerName || "",
    transactionDate: income
      ? toDateInputValue(income.transactionDate)
      : new Date().toISOString().slice(0, 10),
    billNumber: income?.billNumber || "",
    paymentMethod: income?.paymentMethod || "CASH",
    notes: income?.notes || "",
    items: income?.items?.length
      ? income.items.map((item) =>
          createFinanceLineItem({
            id: item.id,
            description: item.description,
            amount: String(item.amount),
          }))
      : [createFinanceLineItem()],
  };
}

function validateForm(form: IncomeFormState): IncomeFormErrors {
  const lineItemValidation = validateFinanceLineItems(form.items);

  return {
    bookingQuery:
      form.bookingQuery.trim() && !form.bookingId
        ? "Select one completed booking from the list or clear this field for a manual entry."
        : undefined,
    customerName: form.customerName.trim()
      ? undefined
      : "Customer name is required.",
    transactionDate: form.transactionDate
      ? undefined
      : "Transaction date is required.",
    billNumber: form.billNumber.trim() ? undefined : "Bill number is required.",
    paymentMethod: form.paymentMethod ? undefined : "Payment method is required.",
    items: lineItemValidation.items,
    itemFields: lineItemValidation.itemFields,
  };
}

function hasFormErrors(errors: IncomeFormErrors) {
  return Boolean(
    errors.bookingQuery ||
      errors.customerName ||
      errors.transactionDate ||
      errors.billNumber ||
      errors.paymentMethod ||
      hasFinanceLineItemErrors({
        items: errors.items,
        itemFields: errors.itemFields,
      }),
  );
}

function refreshAfterDrawerClose(router: ReturnType<typeof useRouter>) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      router.refresh();
    });
  });
}

export function AdminIncomeDrawer({
  bookingOptions: initialBookingOptions,
  income,
  iconOnly = false,
}: AdminIncomeDrawerProps) {
  const drawerDescriptionId = useId();
  const bookingMenuId = useId();
  const bookingDropdownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingOptions, setBookingOptions] = useState(initialBookingOptions);
  const [form, setForm] = useState<IncomeFormState>(() =>
    createInitialState(income),
  );
  const [isBookingMenuOpen, setIsBookingMenuOpen] = useState(false);
  const [activeBookingIndex, setActiveBookingIndex] = useState(0);
  const [isLookupPending, setIsLookupPending] = useState(false);
  const [isPending, startTransition] = useTransition();
  const refreshOnCloseRef = useRef(false);

  const formErrors = useMemo(() => validateForm(form), [form]);
  const isFormInvalid = hasFormErrors(formErrors);
  const totalAmount = useMemo(
    () => getFinanceLineItemsTotal(form.items),
    [form.items],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsLookupPending(true);

      try {
        const result = await getFinanceBookingLookupBrowser(form.bookingQuery);
        setBookingOptions(result.items);
        setActiveBookingIndex(0);
      } catch {
        // Keep the last successful booking list when refresh fails.
      } finally {
        setIsLookupPending(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [form.bookingQuery, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!bookingDropdownRef.current?.contains(event.target as Node)) {
        setIsBookingMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
      setForm(createInitialState(income));
      setBookingOptions(initialBookingOptions);
      setIsBookingMenuOpen(false);
      setActiveBookingIndex(0);
      setIsLookupPending(false);
    }
  }

  function handleDrawerOpenChangeComplete(nextOpen: boolean) {
    if (nextOpen || !refreshOnCloseRef.current) {
      return;
    }

    refreshOnCloseRef.current = false;
    refreshAfterDrawerClose(router);
  }

  function updateForm<K extends keyof IncomeFormState>(
    key: K,
    value: IncomeFormState[K],
  ) {
    setError(null);
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateItem(
    itemId: string,
    nextValue: Partial<FinanceLineItemFormState>,
  ) {
    setError(null);
    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId ? { ...item, ...nextValue } : item,
      ),
    }));
  }

  function addItem() {
    const nextItem = createFinanceLineItem();
    setError(null);
    setForm((current) => ({
      ...current,
      items: [...current.items, nextItem],
    }));
    return nextItem.id;
  }

  function removeItem(itemId: string) {
    setError(null);
    setForm((current) => ({
      ...current,
      items:
        current.items.length <= 1
          ? current.items
          : current.items.filter((item) => item.id !== itemId),
    }));
  }

  function selectBooking(booking: AdminFinanceBookingLookupItem) {
    setError(null);
    setIsBookingMenuOpen(false);
    setActiveBookingIndex(0);

    setForm((current) => {
      const nextItems = [...current.items];

      if (nextItems.length === 0) {
        nextItems.push(
          createFinanceLineItem({
            description: booking.serviceType.name,
          }),
        );
      } else if (!nextItems[0].description.trim()) {
        nextItems[0] = {
          ...nextItems[0],
          description: booking.serviceType.name,
        };
      }

      return {
        ...current,
        bookingId: booking.id,
        bookingQuery: getBookingLabel(booking),
        customerName: booking.contactName,
        items: nextItems,
      };
    });
  }

  function clearBookingSelection() {
    setError(null);
    setForm((current) => ({
      ...current,
      bookingId: null,
      bookingQuery: "",
    }));
    setIsBookingMenuOpen(false);
  }

  function handleBookingQueryChange(value: string) {
    setError(null);
    setIsBookingMenuOpen(true);
    setActiveBookingIndex(0);
    setForm((current) => ({
      ...current,
      bookingId: null,
      bookingQuery: value,
    }));
  }

  function handleBookingKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!bookingOptions.length) {
      if (event.key === "Escape") {
        setIsBookingMenuOpen(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsBookingMenuOpen(true);
      setActiveBookingIndex(
        (current) => (current + 1) % bookingOptions.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsBookingMenuOpen(true);
      setActiveBookingIndex(
        (current) =>
          (current - 1 + bookingOptions.length) % bookingOptions.length,
      );
      return;
    }

    if (event.key === "Enter" && isBookingMenuOpen) {
      event.preventDefault();
      const booking = bookingOptions[activeBookingIndex];

      if (booking) {
        selectBooking(booking);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsBookingMenuOpen(false);
    }
  }

  function onSubmit() {
    if (isFormInvalid) {
      const message =
        "Complete each income item with a description and amount before saving.";
      setError(message);
      pushAppToast({
        title: "Income not saved",
        description: message,
      });
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const payload = {
          bookingId: form.bookingId,
          customerName: form.customerName.trim(),
          transactionDate: form.transactionDate,
          billNumber: form.billNumber.trim(),
          paymentMethod: form.paymentMethod,
          notes: normalizeIncomeNotes(form.notes),
          items: normalizeFinanceLineItemsForSubmit(form.items),
        };

        if (income) {
          await updateIncomeBrowser(income.id, payload);
        } else {
          await createIncomeBrowser(payload);
        }

        pushAppToast({
          title: income ? "Income updated" : "Income saved",
          description: income
            ? "The income record and all line items were updated successfully."
            : "The income record and all line items were saved successfully.",
        });
        refreshOnCloseRef.current = true;
        handleOpenChange(false);
      } catch (nextError) {
        refreshOnCloseRef.current = false;
        const message =
          nextError instanceof BackendApiError
            ? nextError.message || "Unable to save income record"
            : "Unable to save income record";

        setError(message);
        pushAppToast({
          title: "Unable to save income",
          description: message,
        });
      }
    });
  }

  return (
    <>
      {income ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            iconOnly
              ? adminTableEditIconButtonClassName
              : "inline-flex h-8 items-center justify-center rounded-full border border-border px-3 text-[10px] font-medium transition hover:bg-muted"
          }
          aria-label="Edit income"
          title="Edit income"
        >
          <Pencil className="size-3.5" />
          {iconOnly ? (
            <span className="sr-only">Edit income</span>
          ) : (
            <span className="ml-1">Edit</span>
          )}
        </button>
      ) : (
        <Button
          type="button"
          size="icon-lg"
          className="admin-button-text size-8 rounded-[0.95rem]"
          onClick={() => setOpen(true)}
          aria-label="Add Income"
          title="Add Income"
        >
          <Plus className="size-3.5" />
          <span className="sr-only">Add income</span>
        </Button>
      )}

      <AdminDrawer
        open={open}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={handleDrawerOpenChangeComplete}
        title={income ? "Edit income" : "Add income"}
        description="Select a completed booking, then add one or more income items before saving."
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
          className="space-y-3"
          aria-describedby={drawerDescriptionId}
        >
          <p
            id={drawerDescriptionId}
            className="admin-form-helper rounded-[1rem] border border-border/70 bg-muted/30 px-4 py-2"
          >
            Booking-linked income is prioritized here. Manual income is still
            supported if you clear the booking reference and fill the customer
            details directly.
          </p>

          <label className="grid gap-1.5">
            <span className={fieldLabelClassName}>Booking reference</span>
            <div ref={bookingDropdownRef} className="relative">
              <div className="relative">
                <input
                  role="combobox"
                  value={form.bookingQuery}
                  onChange={(event) =>
                    handleBookingQueryChange(event.target.value)
                  }
                  onFocus={() => setIsBookingMenuOpen(true)}
                  onKeyDown={handleBookingKeyDown}
                  placeholder="Search completed booking code or customer name"
                  className={cn(fieldClassName, "pr-20")}
                  aria-expanded={isBookingMenuOpen}
                  aria-controls={bookingMenuId}
                  aria-autocomplete="list"
                />
                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                  {form.bookingId || form.bookingQuery ? (
                    <button
                      type="button"
                      onClick={clearBookingSelection}
                      className="inline-flex h-6 items-center rounded-full border border-border/80 px-2 text-[10px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      Clear
                    </button>
                  ) : null}
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </div>
              </div>

              {isBookingMenuOpen ? (
                <div
                  id={bookingMenuId}
                  className="absolute z-30 mt-1.5 max-h-60 w-full overflow-y-auto rounded-[1rem] border border-border/80 bg-white p-1 shadow-[0_20px_44px_-30px_rgba(15,23,42,0.25)]"
                >
                  {isLookupPending ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-muted-foreground">
                      <LoaderCircle className="size-3.5 animate-spin" />
                      Searching completed bookings...
                    </div>
                  ) : bookingOptions.length ? (
                    bookingOptions.map((booking, index) => {
                      const isActive = index === activeBookingIndex;

                      return (
                        <button
                          key={booking.id}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            selectBooking(booking);
                          }}
                          className={cn(
                            "flex w-full items-start justify-between rounded-[0.85rem] px-3 py-2 text-left transition",
                            isActive
                              ? "bg-muted text-foreground"
                              : "hover:bg-muted/70",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-semibold leading-4 text-foreground">
                              {getBookingLabel(booking)}
                            </p>
                            <p className="mt-1 truncate text-[10px] leading-4 text-muted-foreground">
                              {booking.serviceType.name}
                            </p>
                          </div>
                          {form.bookingId === booking.id ? (
                            <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                          ) : null}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-[11px] leading-4 text-muted-foreground">
                      No completed bookings match this search yet.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            {formErrors.bookingQuery ? (
              <span className="text-[10px] text-destructive">
                {formErrors.bookingQuery}
              </span>
            ) : null}
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className={fieldLabelClassName}>Customer name</span>
              <input
                value={form.customerName}
                onChange={(event) =>
                  updateForm("customerName", event.target.value)
                }
                required
                className={fieldClassName}
              />
              {formErrors.customerName ? (
                <span className="text-[10px] text-destructive">
                  {formErrors.customerName}
                </span>
              ) : null}
            </label>

            <label className="grid gap-1.5">
              <span className={fieldLabelClassName}>Transaction date</span>
              <input
                type="date"
                value={form.transactionDate}
                onChange={(event) =>
                  updateForm("transactionDate", event.target.value)
                }
                required
                className={fieldClassName}
              />
              {formErrors.transactionDate ? (
                <span className="text-[10px] text-destructive">
                  {formErrors.transactionDate}
                </span>
              ) : null}
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className={fieldLabelClassName}>Bill number</span>
              <input
                value={form.billNumber}
                onChange={(event) => updateForm("billNumber", event.target.value)}
                required
                className={fieldClassName}
              />
              {formErrors.billNumber ? (
                <span className="text-[10px] text-destructive">
                  {formErrors.billNumber}
                </span>
              ) : null}
            </label>

            <label className="grid gap-1.5">
              <span className={fieldLabelClassName}>Payment method</span>
              <select
                value={form.paymentMethod}
                onChange={(event) =>
                  updateForm(
                    "paymentMethod",
                    event.target.value as FinancePaymentMethod,
                  )
                }
                className={fieldClassName}
              >
                {financePaymentMethodOptions.map((item) => (
                  <option key={item} value={item}>
                    {getFinancePaymentMethodLabel(item)}
                  </option>
                ))}
              </select>
              {formErrors.paymentMethod ? (
                <span className="text-[10px] text-destructive">
                  {formErrors.paymentMethod}
                </span>
              ) : null}
            </label>
          </div>

          <AdminFinanceLineItemsSection
            title="Income items"
            description="Add one or more line items for this booking or manual income entry."
            items={form.items}
            errors={{ items: formErrors.items, itemFields: formErrors.itemFields }}
            totalLabel="Total income"
            descriptionPlaceholder="cleaning AC 1 unit"
            totalDescription={
              form.bookingId
                ? "Saving will mark the selected booking as Paid."
                : "Manual income entries stay detached from booking status."
            }
            totalAmount={totalAmount}
            disabled={isPending}
            onAdd={addItem}
            onRemove={removeItem}
            onDescriptionChange={(itemId, value) =>
              updateItem(itemId, { description: value })
            }
            onAmountChange={(itemId, value) =>
              updateItem(itemId, { amount: value })
            }
          />

          <label className="grid gap-1.5">
            <span className={fieldLabelClassName}>Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              rows={3}
              className={textareaClassName}
            />
          </label>

          {error ? (
            <div className="rounded-[1rem] border border-destructive/25 bg-destructive/8 px-4 py-2 text-[11px] leading-4 text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end border-t border-border/70 pt-3">
            <Button
              type="submit"
              className={financeDrawerPrimaryButtonClassName}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                income ? "Save" : "Add"
              )}
            </Button>
          </div>
        </form>
      </AdminDrawer>
    </>
  );
}
