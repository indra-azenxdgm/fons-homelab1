import type { ExpenseCategory, ExpensePaymentMethod, FinancePaymentMethod } from "@/features/admin/lib/shared/admin-finance-types";

export function formatFinanceDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getFinancePaymentMethodLabel(value: FinancePaymentMethod) {
  switch (value) {
    case "CASH":
      return "Cash";
    case "TRANSFER_BCA":
      return "Transfer BCA";
    case "TRANSFER_BRI":
      return "Transfer BRI";
    case "TRANSFER_BNI":
      return "Transfer BNI";
    case "TRANSFER_MANDIRI":
      return "Transfer Mandiri";
    case "OTHER":
      return "Other";
    default:
      return "Unknown";
  }
}

export function getExpenseCategoryLabel(value: ExpenseCategory) {
  switch (value) {
    case "OPERATIONAL":
      return "Operational";
    case "SPARE_PART":
      return "Spare Part";
    case "MAINTENANCE":
      return "Maintenance";
    case "OFFICE":
      return "Office";
    case "SUBSCRIPTION":
      return "Subscription";
    case "TRANSPORTATION":
      return "Transportation";
    case "TOOLS":
      return "Tools";
    default:
      return "Other";
  }
}

export function getExpensePaymentMethodLabel(value: ExpensePaymentMethod) {
  switch (value) {
    case "CASH":
      return "Cash";
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "QRIS":
      return "QRIS";
    default:
      return "Other";
  }
}

export type PaymentMethodTone =
  | "cash"
  | "transfer_bca"
  | "transfer_bni"
  | "transfer_bri"
  | "transfer_mandiri"
  | "bank_transfer"
  | "qris"
  | "other";

export type ExpenseCategoryTone =
  | "operational"
  | "spare_part"
  | "maintenance"
  | "office"
  | "subscription"
  | "transportation"
  | "tools"
  | "other";

const paymentMethodBadgeClassNameMap: Record<PaymentMethodTone, string> = {
  cash:
    "border-emerald-200/90 bg-emerald-50 text-emerald-800",
  transfer_bca:
    "border-sky-200/90 bg-sky-50 text-sky-800",
  transfer_bni:
    "border-cyan-200/90 bg-cyan-50 text-cyan-800",
  transfer_bri:
    "border-rose-200/90 bg-rose-50 text-rose-800",
  transfer_mandiri:
    "border-amber-200/90 bg-amber-50 text-amber-800",
  bank_transfer:
    "border-indigo-200/90 bg-indigo-50 text-indigo-800",
  qris:
    "border-fuchsia-200/90 bg-fuchsia-50 text-fuchsia-800",
  other:
    "border-slate-200/90 bg-slate-100/80 text-slate-700",
};

const paymentMethodColorMap: Record<PaymentMethodTone, string> = {
  cash: "#2f9e8f",
  transfer_bca: "#4c82d9",
  transfer_bni: "#2d9fa4",
  transfer_bri: "#d46a6a",
  transfer_mandiri: "#d99a4e",
  bank_transfer: "#5f76d6",
  qris: "#8c6ccf",
  other: "#94a3b8",
};

const expenseCategoryColorMap: Record<ExpenseCategoryTone, string> = {
  operational: "#2f9e8f",
  spare_part: "#4c82d9",
  maintenance: "#d46a6a",
  office: "#6f83c7",
  subscription: "#8c6ccf",
  transportation: "#d99a4e",
  tools: "#2d9fa4",
  other: "#94a3b8",
};

export function getPaymentMethodTone(value: string) {
  const normalized = value.trim().toLowerCase().replaceAll(/[\s_-]+/g, " ");

  if (!normalized) {
    return "other" as const;
  }

  if (normalized.includes("cash")) {
    return "cash" as const;
  }

  if ((normalized.includes("transfer") && normalized.includes("bca")) || (normalized.includes("bca") && normalized.includes("transfer"))) {
    return "transfer_bca" as const;
  }

  if ((normalized.includes("transfer") && normalized.includes("bni")) || (normalized.includes("bni") && normalized.includes("transfer"))) {
    return "transfer_bni" as const;
  }

  if ((normalized.includes("transfer") && normalized.includes("bri")) || (normalized.includes("bri") && normalized.includes("transfer"))) {
    return "transfer_bri" as const;
  }

  if ((normalized.includes("transfer") && normalized.includes("mandiri")) || (normalized.includes("mandiri") && normalized.includes("transfer"))) {
    return "transfer_mandiri" as const;
  }

  if (normalized.includes("bank transfer") || (normalized.includes("bank") && normalized.includes("transfer"))) {
    return "bank_transfer" as const;
  }

  if (normalized.includes("qris")) {
    return "qris" as const;
  }

  return "other" as const;
}

export function getPaymentMethodBadgeClassName(value: string) {
  return paymentMethodBadgeClassNameMap[getPaymentMethodTone(value)];
}

export function getPaymentMethodColor(value: string) {
  return paymentMethodColorMap[getPaymentMethodTone(value)];
}

export function getExpenseCategoryTone(value: string) {
  const normalized = value.trim().toLowerCase().replaceAll(/[\s_-]+/g, " ");

  if (!normalized) {
    return "other" as const;
  }

  if (normalized.includes("operational")) {
    return "operational" as const;
  }

  if (normalized.includes("spare") || normalized.includes("material")) {
    return "spare_part" as const;
  }

  if (normalized.includes("maintenance")) {
    return "maintenance" as const;
  }

  if (normalized.includes("office")) {
    return "office" as const;
  }

  if (normalized.includes("subscription")) {
    return "subscription" as const;
  }

  if (normalized.includes("transport")) {
    return "transportation" as const;
  }

  if (normalized.includes("tool")) {
    return "tools" as const;
  }

  return "other" as const;
}

export function getExpenseCategoryColor(value: string) {
  return expenseCategoryColorMap[getExpenseCategoryTone(value)];
}
