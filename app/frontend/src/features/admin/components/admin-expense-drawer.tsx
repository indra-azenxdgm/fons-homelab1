"use client";

import { useId, useMemo, useRef, useState, useTransition } from "react";
import { LoaderCircle, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { pushAppToast } from "@/components/app-toast-viewport";
import { Button } from "@/components/ui/button";
import {
  BackendApiError,
  createExpenseBrowser,
  updateExpenseBrowser,
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
import {
  getExpenseCategoryLabel,
  getExpensePaymentMethodLabel,
} from "@/features/admin/lib/shared/admin-finance";
import {
  expenseCategoryOptions,
  expensePaymentMethodOptions,
  type AdminExpenseListItem,
  type ExpenseCategory,
  type ExpensePaymentMethod,
} from "@/features/admin/lib/shared/admin-finance-types";

const fieldClassName =
  "h-8 w-full rounded-[1rem] border border-border bg-background px-2.5 py-1.5 text-[11px] leading-4 outline-none transition focus:border-primary";

const fieldLabelClassName = "admin-kicker-label";
const textareaClassName =
  "w-full rounded-[1rem] border border-border bg-background px-3 py-2 text-[11px] leading-4 outline-none transition focus:border-primary";

type ExpenseFormState = {
  transactionDate: string;
  billCode: string;
  category: ExpenseCategory;
  paymentMethod: ExpensePaymentMethod;
  notes: string;
  items: FinanceLineItemFormState[];
};

type ExpenseFormErrors = {
  transactionDate?: string;
  billCode?: string;
  category?: string;
  paymentMethod?: string;
  items?: string;
  itemFields: FinanceLineItemFieldError[];
};

type AdminExpenseDrawerProps = {
  expense?: AdminExpenseListItem;
  iconOnly?: boolean;
};

function toDateInputValue(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function normalizeExpenseNotes(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function createInitialState(expense?: AdminExpenseListItem): ExpenseFormState {
  return {
    transactionDate: expense
      ? toDateInputValue(expense.transactionDate)
      : new Date().toISOString().slice(0, 10),
    billCode: expense?.billCode || "",
    category: expense?.category || "OPERATIONAL",
    paymentMethod: expense?.paymentMethod || "CASH",
    notes: expense?.notes || "",
    items: expense?.items?.length
      ? expense.items.map((item) =>
          createFinanceLineItem({
            id: item.id,
            description: item.description,
            amount: String(item.amount),
          }))
      : [
          createFinanceLineItem({
            description: expense?.expenseType || "",
            amount: expense?.amount ? String(expense.amount) : "",
          }),
        ],
  };
}

function validateForm(form: ExpenseFormState): ExpenseFormErrors {
  const lineItemValidation = validateFinanceLineItems(form.items);

  return {
    transactionDate: form.transactionDate ? undefined : "Date is required.",
    billCode: form.billCode.trim() ? undefined : "Bill code is required.",
    category: form.category ? undefined : "Category is required.",
    paymentMethod: form.paymentMethod ? undefined : "Payment method is required.",
    items: lineItemValidation.items,
    itemFields: lineItemValidation.itemFields,
  };
}

function hasFormErrors(errors: ExpenseFormErrors) {
  return Boolean(
    errors.transactionDate ||
      errors.billCode ||
      errors.category ||
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

export function AdminExpenseDrawer({
  expense,
  iconOnly = false,
}: AdminExpenseDrawerProps) {
  const drawerDescriptionId = useId();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseFormState>(() =>
    createInitialState(expense),
  );
  const [isPending, startTransition] = useTransition();
  const refreshOnCloseRef = useRef(false);

  const formErrors = useMemo(() => validateForm(form), [form]);
  const isFormInvalid = hasFormErrors(formErrors);
  const totalAmount = useMemo(
    () => getFinanceLineItemsTotal(form.items),
    [form.items],
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
      setForm(createInitialState(expense));
    }
  }

  function handleDrawerOpenChangeComplete(nextOpen: boolean) {
    if (nextOpen || !refreshOnCloseRef.current) {
      return;
    }

    refreshOnCloseRef.current = false;
    refreshAfterDrawerClose(router);
  }

  function updateForm<K extends keyof ExpenseFormState>(
    key: K,
    value: ExpenseFormState[K],
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

  function onSubmit() {
    if (isFormInvalid) {
      const message =
        "Complete each expense item with a description and amount before saving.";
      setError(message);
      pushAppToast({
        title: "Expense not saved",
        description: message,
      });
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const payload = {
          transactionDate: form.transactionDate,
          billCode: form.billCode.trim().toUpperCase(),
          category: form.category,
          paymentMethod: form.paymentMethod,
          notes: normalizeExpenseNotes(form.notes),
          items: normalizeFinanceLineItemsForSubmit(form.items),
        };

        if (expense) {
          await updateExpenseBrowser(expense.id, payload);
        } else {
          await createExpenseBrowser(payload);
        }

        pushAppToast({
          title: expense ? "Expense updated" : "Expense saved",
          description: expense
            ? "The expense record and all line items were updated successfully."
            : "The expense record and all line items were saved successfully.",
        });
        refreshOnCloseRef.current = true;
        handleOpenChange(false);
      } catch (nextError) {
        refreshOnCloseRef.current = false;
        const message =
          nextError instanceof BackendApiError
            ? nextError.message || "Unable to save expense record"
            : "Unable to save expense record";

        setError(message);
        pushAppToast({
          title: "Unable to save expense",
          description: message,
        });
      }
    });
  }

  return (
    <>
      {expense ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            iconOnly
              ? adminTableEditIconButtonClassName
              : "inline-flex h-8 items-center justify-center rounded-full border border-border px-3 text-[10px] font-medium transition hover:bg-muted"
          }
          aria-label="Edit expense"
          title="Edit expense"
        >
          <Pencil className="size-3.5" />
          {iconOnly ? (
            <span className="sr-only">Edit expense</span>
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
          aria-label="Add Expense"
          title="Add Expense"
        >
          <Plus className="size-3.5" />
          <span className="sr-only">Add expense</span>
        </Button>
      )}

      <AdminDrawer
        open={open}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={handleDrawerOpenChangeComplete}
        title={expense ? "Edit expense" : "Add expense"}
        description="Capture operational spending with one or more expense line items in the same compact finance drawer flow."
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
            Capture the full expense record: bill code, category, payment
            method, one or more expense items, and optional notes.
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className={fieldLabelClassName}>Date</span>
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

            <label className="grid gap-1.5">
              <span className={fieldLabelClassName}>Bill code</span>
              <input
                value={form.billCode}
                onChange={(event) =>
                  updateForm("billCode", event.target.value.toUpperCase())
                }
                placeholder="OPS-0001"
                required
                className={fieldClassName}
              />
              {formErrors.billCode ? (
                <span className="text-[10px] text-destructive">
                  {formErrors.billCode}
                </span>
              ) : null}
            </label>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className={fieldLabelClassName}>Category</span>
              <select
                value={form.category}
                onChange={(event) =>
                  updateForm("category", event.target.value as ExpenseCategory)
                }
                className={fieldClassName}
              >
                {expenseCategoryOptions.map((item) => (
                  <option key={item} value={item}>
                    {getExpenseCategoryLabel(item)}
                  </option>
                ))}
              </select>
              {formErrors.category ? (
                <span className="text-[10px] text-destructive">
                  {formErrors.category}
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
                    event.target.value as ExpensePaymentMethod,
                  )
                }
                className={fieldClassName}
              >
                {expensePaymentMethodOptions.map((item) => (
                  <option key={item} value={item}>
                    {getExpensePaymentMethodLabel(item)}
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
            title="Expense items"
            description="Add one or more line items and the total expense will update automatically."
            items={form.items}
            errors={{ items: formErrors.items, itemFields: formErrors.itemFields }}
            totalLabel="Total expense"
            descriptionPlaceholder="Office snack"
            totalDescription="All line items are saved together in one expense record."
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
                "Save"
              )}
            </Button>
          </div>
        </form>
      </AdminDrawer>
    </>
  );
}
