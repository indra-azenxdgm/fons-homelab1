export type FinanceLineItemFormState = {
  id: string;
  description: string;
  amount: string;
};

export type FinanceLineItemFieldError = {
  description?: string;
  amount?: string;
};

function createFinanceLineItemId() {
  if (typeof globalThis !== "undefined" && "crypto" in globalThis && typeof globalThis.crypto?.randomUUID === "function") {
    return `item-${globalThis.crypto.randomUUID()}`;
  }

  return `item-${Math.random().toString(36).slice(2, 10)}`;
}

export function createFinanceLineItem(input?: Partial<FinanceLineItemFormState>): FinanceLineItemFormState {
  return {
    id: input?.id || createFinanceLineItemId(),
    description: input?.description || "",
    amount: input?.amount || "",
  };
}

export function parseFinanceLineItemAmount(value: string) {
  const digitsOnly = value.replace(/[^\d]/g, "");

  if (!digitsOnly) {
    return Number.NaN;
  }

  return Number(digitsOnly);
}

export function validateFinanceLineItems(items: FinanceLineItemFormState[]) {
  const itemFields: FinanceLineItemFieldError[] = items.map((item) => {
    const amount = parseFinanceLineItemAmount(item.amount);

    return {
      description: item.description.trim() ? undefined : "Description is required.",
      amount: Number.isFinite(amount) && amount > 0 ? undefined : "Amount must be greater than 0.",
    };
  });

  return {
    items: items.length > 0 ? undefined : "Add at least one line item.",
    itemFields,
  };
}

export function hasFinanceLineItemErrors(input: {
  items?: string;
  itemFields: FinanceLineItemFieldError[];
}) {
  return Boolean(
    input.items
    || input.itemFields.some((item) => item.description || item.amount),
  );
}

export function getFinanceLineItemsTotal(items: FinanceLineItemFormState[]) {
  return items.reduce((total, item) => {
    const amount = parseFinanceLineItemAmount(item.amount);
    return Number.isFinite(amount) && amount > 0 ? total + amount : total;
  }, 0);
}

export function normalizeFinanceLineItemsForSubmit(items: FinanceLineItemFormState[]) {
  return items.map((item) => ({
    description: item.description.trim(),
    amount: parseFinanceLineItemAmount(item.amount),
  }));
}
