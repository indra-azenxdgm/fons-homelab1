import {
  BookingStatus,
  ExpenseCategory,
  ExpensePaymentMethod,
  FinancePaymentMethod,
  Prisma,
} from "@prisma/client";
import * as XLSX from "xlsx";

import { db } from "@/lib/prisma";
import {
  applyBrandedWorksheetLayout,
  applyWorkbookBranding,
  buildBrandedWorksheetData,
  buildExportBranding,
  buildExportMetadata,
  type ExportPreparedByInput,
} from "@/services/export-branding.service";
import {
  flattenExpenseExportRows,
  flattenIncomeExportRows,
} from "@/services/finance-export-rows";
import { renderBrandedPdfTableReport } from "@/services/export-pdf.service";
import { buildExportFilename, resolveExportPreset } from "@/services/export-preset.service";

const incomePageSize = 12;
const expensePageSize = 12;
const fallbackIncomeCustomerName = "Unknown customer";
const fallbackIncomeBillNumber = "-";
const fallbackIncomeDescription = "Manual income entry";
const fallbackExpenseBillCode = "-";
const fallbackExpenseName = "Unnamed expense";
const fallbackExpenseCategory = ExpenseCategory.OTHER;
const fallbackExpensePaymentMethod = ExpensePaymentMethod.OTHER;

type IncomeItemInput = {
  description: string;
  amount: number;
};

type ExpenseItemInput = {
  description: string;
  amount: number;
};

type FinanceOverviewPeriod = "7D" | "30D" | "3M" | "12M";

type FinanceOverviewBucket = {
  key: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
};

type FinanceOverviewRange = {
  period: FinanceOverviewPeriod;
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  bucketLabels: Array<{
    key: string;
    label: string;
  }>;
  bucketType: "day" | "month";
  label: string;
};

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseDateOnly(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function endOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 23, 59, 59, 999));
}

function startOfUtcMonth(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

function endOfUtcMonth(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

function addUtcDays(value: Date, amount: number) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate() + amount));
}

function addUtcMonths(value: Date, amount: number) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + amount, 1));
}

function formatMonthShort(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  }).format(value);
}

function formatMonthShortWithYear(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(value);
}

function formatDayShort(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(value);
}

function createFinanceOverviewRange(period: FinanceOverviewPeriod, now = new Date()): FinanceOverviewRange {
  const today = startOfUtcDay(now);

  if (period === "7D" || period === "30D") {
    const dayCount = period === "7D" ? 7 : 30;
    const start = addUtcDays(today, -(dayCount - 1));
    const end = endOfUtcDay(today);
    const previousStart = addUtcDays(start, -dayCount);
    const previousEnd = endOfUtcDay(addUtcDays(start, -1));

    return {
      period,
      start,
      end,
      previousStart,
      previousEnd,
      bucketType: "day",
      label: period === "7D" ? "Last 7 days" : "Last 30 days",
      bucketLabels: Array.from({ length: dayCount }, (_, index) => {
        const bucketDate = addUtcDays(start, index);
        return {
          key: bucketDate.toISOString().slice(0, 10),
          label: formatDayShort(bucketDate),
        };
      }),
    };
  }

  const monthCount = period === "3M" ? 3 : 12;
  const currentMonthStart = startOfUtcMonth(today);
  const start = addUtcMonths(currentMonthStart, -(monthCount - 1));
  const end = endOfUtcMonth(currentMonthStart);
  const previousStart = addUtcMonths(start, -monthCount);
  const previousEnd = endOfUtcMonth(addUtcMonths(start, -1));

  return {
    period,
    start,
    end,
    previousStart,
    previousEnd,
    bucketType: "month",
    label: period === "3M" ? "Last 3 months" : "Last 12 months",
    bucketLabels: Array.from({ length: monthCount }, (_, index) => {
      const bucketDate = addUtcMonths(start, index);
      return {
        key: `${bucketDate.getUTCFullYear()}-${String(bucketDate.getUTCMonth() + 1).padStart(2, "0")}`,
        label: monthCount <= 3 ? formatMonthShortWithYear(bucketDate) : formatMonthShort(bucketDate),
      };
    }),
  };
}

function getDateBucketKey(value: Date, bucketType: FinanceOverviewRange["bucketType"]) {
  if (bucketType === "day") {
    return value.toISOString().slice(0, 10);
  }

  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

function calculateDeltaPercent(current: number, previous: number) {
  if (previous <= 0) {
    return null;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function sumByAmount<T extends { amount: number }>(items: T[]) {
  return items.reduce((total, item) => total + item.amount, 0);
}

function calculatePercentage(total: number, whole: number) {
  if (whole <= 0) {
    return 0;
  }

  return Number(((total / whole) * 100).toFixed(1));
}

function formatDateForExport(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatCurrencyForExport(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildDateRangeLabelForExport(filters: {
  from?: string;
  to?: string;
}) {
  const from = parseDateOnly(filters.from);
  const to = parseDateOnly(filters.to);

  if (from && to) {
    return `${formatDateForExport(from)} - ${formatDateForExport(to)}`;
  }

  if (from) {
    return `From ${formatDateForExport(from)}`;
  }

  if (to) {
    return `Until ${formatDateForExport(to)}`;
  }

  return null;
}

function buildIncomeExportSubtitle(filters: Parameters<typeof listIncomeRecords>[0]) {
  const parts = [buildDateRangeLabelForExport(filters)];

  if (filters.paymentMethod) {
    parts.push(getFinancePaymentMethodLabel(filters.paymentMethod));
  }

  if (filters.bookingLink === "linked") {
    parts.push("Booking-linked entries");
  } else if (filters.bookingLink === "manual") {
    parts.push("Manual entries");
  }

  return parts.filter(Boolean).join(" | ") || null;
}

function buildExpenseExportSubtitle(filters: Parameters<typeof listExpenseRecords>[0]) {
  return buildDateRangeLabelForExport(filters);
}

function buildIncomeExportSummaryLines(items: Array<ReturnType<typeof mapIncomeRecord>>) {
  const totalAmount = items.reduce((total, item) => total + item.amount, 0);
  const linkedCount = items.filter((item) => item.bookingCode).length;
  const manualCount = items.length - linkedCount;

  return [
    `Records: ${items.length} | Total income: ${formatCurrencyForExport(totalAmount)}`,
    `Booking-linked: ${linkedCount} | Manual: ${manualCount}`,
  ];
}

function buildExpenseExportSummaryLines(items: Array<ReturnType<typeof mapExpenseRecord> & { amount: number }>) {
  const totalAmount = items.reduce((total, item) => total + item.amount, 0);
  const categoryCount = new Set(items.map((item) => item.category)).size;

  return [
    `Records: ${items.length} | Total expenses: ${formatCurrencyForExport(totalAmount)}`,
    `Categories: ${categoryCount}`,
  ];
}

function getFinancePaymentMethodLabel(value: FinancePaymentMethod) {
  switch (value) {
    case FinancePaymentMethod.CASH:
      return "Cash";
    case FinancePaymentMethod.TRANSFER_BCA:
      return "Transfer BCA";
    case FinancePaymentMethod.TRANSFER_BRI:
      return "Transfer BRI";
    case FinancePaymentMethod.TRANSFER_BNI:
      return "Transfer BNI";
    case FinancePaymentMethod.TRANSFER_MANDIRI:
      return "Transfer Mandiri";
    case FinancePaymentMethod.OTHER:
      return "Other";
    default:
      return "Unknown";
  }
}

function getExpenseCategoryLabel(value: ExpenseCategory) {
  switch (value) {
    case ExpenseCategory.OPERATIONAL:
      return "Operational";
    case ExpenseCategory.SPARE_PART:
      return "Spare Part";
    case ExpenseCategory.MAINTENANCE:
      return "Maintenance";
    case ExpenseCategory.OFFICE:
      return "Office";
    case ExpenseCategory.SUBSCRIPTION:
      return "Subscription";
    case ExpenseCategory.TRANSPORTATION:
      return "Transportation";
    case ExpenseCategory.TOOLS:
      return "Tools";
    default:
      return "Other";
  }
}

function getExpensePaymentMethodLabel(value: ExpensePaymentMethod) {
  switch (value) {
    case ExpensePaymentMethod.CASH:
      return "Cash";
    case ExpensePaymentMethod.BANK_TRANSFER:
      return "Bank Transfer";
    case ExpensePaymentMethod.QRIS:
      return "QRIS";
    default:
      return "Other";
  }
}

function normalizeIncomeItems(items: IncomeItemInput[]) {
  const normalizedItems = items.map((item) => ({
    description: item.description.trim(),
    amount: item.amount,
  }));

  if (normalizedItems.some((item) => !item.description || !Number.isFinite(item.amount) || item.amount <= 0)) {
    throw new Error("INCOME_ITEMS_INVALID");
  }

  return normalizedItems;
}

function buildIncomeSummaryDescription(items: IncomeItemInput[]) {
  if (items.length === 0) {
    return fallbackIncomeDescription;
  }

  if (items.length === 1) {
    return items[0].description;
  }

  return `${items[0].description} +${items.length - 1} more`;
}

function sumIncomeItems(items: IncomeItemInput[]) {
  return items.reduce((total, item) => total + item.amount, 0);
}

function normalizeExpenseItems(items: ExpenseItemInput[]) {
  const normalizedItems = items.map((item) => ({
    description: item.description.trim(),
    amount: item.amount,
  }));

  if (normalizedItems.some((item) => !item.description || !Number.isFinite(item.amount) || item.amount <= 0)) {
    throw new Error("EXPENSE_ITEMS_INVALID");
  }

  return normalizedItems;
}

function buildExpenseSummaryDescription(items: ExpenseItemInput[]) {
  if (items.length === 0) {
    return fallbackExpenseName;
  }

  if (items.length === 1) {
    return items[0].description;
  }

  return `${items[0].description} +${items.length - 1} more`;
}

function sumExpenseItems(items: ExpenseItemInput[]) {
  return items.reduce((total, item) => total + item.amount, 0);
}

function mapIncomeRecord<T extends {
  customerName: string | null;
  billNumber: string | null;
  serviceDescription: string | null;
  amount: number;
  paymentMethod: FinancePaymentMethod | null;
  booking?: {
    bookingCode: string | null;
    contactName?: string | null;
  } | null;
  items?: Array<{
    id: string;
    description: string;
    amount: number;
    sortOrder: number;
  }>;
}>(item: T) {
  const mappedItems =
    item.items?.length
      ? [...item.items]
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map((entry) => ({
            id: entry.id,
            description: normalizeOptionalText(entry.description) || fallbackIncomeDescription,
            amount: entry.amount,
            sortOrder: entry.sortOrder,
          }))
      : [{
          id: "legacy",
          description: normalizeOptionalText(item.serviceDescription) || fallbackIncomeDescription,
          amount: item.amount,
          sortOrder: 0,
        }];

  return {
    ...item,
    bookingCode: item.booking?.bookingCode || null,
    customerName:
      normalizeOptionalText(item.customerName)
      || normalizeOptionalText(item.booking?.contactName)
      || fallbackIncomeCustomerName,
    billNumber: normalizeOptionalText(item.billNumber) || fallbackIncomeBillNumber,
    serviceDescription:
      normalizeOptionalText(item.serviceDescription)
      || buildIncomeSummaryDescription(mappedItems)
      || fallbackIncomeDescription,
    amount: sumIncomeItems(mappedItems),
    paymentMethod: item.paymentMethod ?? FinancePaymentMethod.OTHER,
    items: mappedItems,
  };
}

function buildIncomeWhere(filters: {
  q?: string;
  from?: string;
  to?: string;
  paymentMethod?: FinancePaymentMethod;
  bookingLink?: "linked" | "manual";
}): Prisma.IncomeRecordWhereInput {
  const query = filters.q?.trim();

  return {
    paymentMethod: filters.paymentMethod,
    bookingId:
      filters.bookingLink === "linked"
        ? { not: null }
        : filters.bookingLink === "manual"
          ? null
          : undefined,
    transactionDate: {
      gte: parseDateOnly(filters.from),
      lte: parseDateOnly(filters.to),
    },
    OR: query
      ? [
          { customerName: { contains: query, mode: "insensitive" } },
          { billNumber: { contains: query, mode: "insensitive" } },
          { serviceDescription: { contains: query, mode: "insensitive" } },
          { items: { some: { description: { contains: query, mode: "insensitive" } } } },
          { booking: { bookingCode: { contains: query, mode: "insensitive" } } },
        ]
      : undefined,
  };
}

function buildExpenseWhere(filters: {
  q?: string;
  from?: string;
  to?: string;
}): Prisma.ExpenseRecordWhereInput {
  const query = filters.q?.trim();

  return {
    transactionDate: {
      gte: parseDateOnly(filters.from),
      lte: parseDateOnly(filters.to),
    },
    OR: query
      ? [
          { billCode: { contains: query, mode: "insensitive" } },
          { expenseType: { contains: query, mode: "insensitive" } },
          { items: { some: { description: { contains: query, mode: "insensitive" } } } },
          { notes: { contains: query, mode: "insensitive" } },
        ]
      : undefined,
  };
}

function mapExpenseRecord<T extends {
  billCode: string | null;
  expenseType: string | null;
  amount: number;
  category: ExpenseCategory | null;
  paymentMethod: ExpensePaymentMethod | null;
  notes: string | null;
  items?: Array<{
    id: string;
    description: string;
    amount: number;
    sortOrder: number;
  }>;
}>(item: T) {
  const mappedItems =
    item.items?.length
      ? [...item.items]
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map((entry) => ({
            id: entry.id,
            description: normalizeOptionalText(entry.description) || fallbackExpenseName,
            amount: entry.amount,
            sortOrder: entry.sortOrder,
          }))
      : [{
          id: "legacy",
          description: normalizeOptionalText(item.expenseType) || fallbackExpenseName,
          amount: item.amount,
          sortOrder: 0,
        }];

  return {
    ...item,
    billCode: normalizeOptionalText(item.billCode) || fallbackExpenseBillCode,
    expenseType:
      normalizeOptionalText(item.expenseType)
      || buildExpenseSummaryDescription(mappedItems)
      || fallbackExpenseName,
    category: item.category ?? fallbackExpenseCategory,
    amount: sumExpenseItems(mappedItems),
    paymentMethod: item.paymentMethod ?? fallbackExpensePaymentMethod,
    notes: normalizeOptionalText(item.notes),
    items: mappedItems,
  };
}

async function ensureExpenseBillCodeAvailable(
  billCode: string,
  expenseId?: string,
  tx: Prisma.TransactionClient = db,
) {
  const existing = await tx.expenseRecord.findFirst({
    where: {
      billCode,
      id: expenseId ? { not: expenseId } : undefined,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    throw new Error("EXPENSE_BILL_CODE_CONFLICT");
  }
}

async function resolveBookingSnapshot(
  bookingId: string | null | undefined,
  input: {
    allowPaidBookingId?: string | null;
  } = {},
  tx: Prisma.TransactionClient = db,
) {
  if (!bookingId) {
    return null;
  }

  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      bookingCode: true,
      contactName: true,
      status: true,
      serviceType: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error("FINANCE_BOOKING_NOT_FOUND");
  }

  const isAllowedPaidBooking =
    booking.status === BookingStatus.PAID
    && input.allowPaidBookingId
    && booking.id === input.allowPaidBookingId;

  if (booking.status !== BookingStatus.COMPLETED && !isAllowedPaidBooking) {
    throw new Error("FINANCE_BOOKING_NOT_COMPLETED");
  }

  return booking;
}

async function ensureIncomeBillNumberAvailable(
  billNumber: string,
  incomeId?: string,
  tx: Prisma.TransactionClient = db,
) {
  const existing = await tx.incomeRecord.findFirst({
    where: {
      billNumber,
      id: incomeId ? { not: incomeId } : undefined,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    throw new Error("INCOME_BILL_NUMBER_CONFLICT");
  }
}

async function syncBookingPaymentStatus(
  bookingId: string | null | undefined,
  tx: Prisma.TransactionClient,
) {
  if (!bookingId) {
    return;
  }

  const linkedIncomeCount = await tx.incomeRecord.count({
    where: {
      bookingId,
    },
  });

  const nextStatus = linkedIncomeCount > 0 ? BookingStatus.PAID : BookingStatus.COMPLETED;

  await tx.booking.updateMany({
    where: {
      id: bookingId,
      status:
        linkedIncomeCount > 0
          ? { not: BookingStatus.PAID }
          : BookingStatus.PAID,
    },
    data: {
      status: nextStatus,
    },
  });
}

function createIncomeCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INC-${timestamp}-${randomPart}`;
}

function buildIncomeItemCreateData(items: IncomeItemInput[]) {
  return items.map((item, index) => ({
    sortOrder: index,
    description: item.description,
    amount: item.amount,
  }));
}

function buildExpenseItemCreateData(items: ExpenseItemInput[]) {
  return items.map((item, index) => ({
    sortOrder: index,
    description: item.description,
    amount: item.amount,
  }));
}

export async function listFinanceBookings(input: { q?: string; limit?: number }) {
  const query = input.q?.trim();
  const limit = input.limit ?? 20;

  return db.booking.findMany({
    where: {
      status: BookingStatus.COMPLETED,
      OR: query
        ? [
            { bookingCode: { contains: query, mode: "insensitive" } },
            { contactName: { contains: query, mode: "insensitive" } },
            { customer: { fullName: { contains: query, mode: "insensitive" } } },
          ]
        : undefined,
    },
    orderBy: [{ bookingDate: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      bookingCode: true,
      contactName: true,
      bookingDate: true,
      serviceType: {
        select: {
          name: true,
        },
      },
    },
  });
}

export async function listIncomeRecords(filters: {
  q?: string;
  from?: string;
  to?: string;
  paymentMethod?: FinancePaymentMethod;
  bookingLink?: "linked" | "manual";
  page?: string;
}) {
  const page = Number.parseInt(filters.page || "1", 10);
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
  const where = buildIncomeWhere(filters);

  const [items, totalCount] = await db.$transaction([
    db.incomeRecord.findMany({
      where,
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      skip: (currentPage - 1) * incomePageSize,
      take: incomePageSize,
      select: {
        id: true,
        incomeCode: true,
        bookingId: true,
        customerName: true,
        transactionDate: true,
        billNumber: true,
        amount: true,
        serviceDescription: true,
        paymentMethod: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        booking: {
          select: {
            bookingCode: true,
            contactName: true,
          },
        },
        items: {
          select: {
            id: true,
            description: true,
            amount: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    }),
    db.incomeRecord.count({ where }),
  ]);

  return {
    items: items.map((item) => mapIncomeRecord(item)),
    totalCount,
    page: currentPage,
    pageSize: incomePageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / incomePageSize)),
  };
}

export async function getIncomeRecord(incomeId: string) {
  const income = await db.incomeRecord.findUnique({
    where: { id: incomeId },
    select: {
      id: true,
      incomeCode: true,
      bookingId: true,
      customerName: true,
      transactionDate: true,
      billNumber: true,
      amount: true,
      serviceDescription: true,
      paymentMethod: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      booking: {
        select: {
          bookingCode: true,
          contactName: true,
        },
      },
      items: {
        select: {
          id: true,
          description: true,
          amount: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!income) {
    throw new Error("INCOME_NOT_FOUND");
  }

  return mapIncomeRecord(income);
}

export async function createIncomeRecord(input: {
  bookingId?: string | null;
  customerName: string;
  transactionDate: string;
  billNumber: string;
  paymentMethod: FinancePaymentMethod;
  notes?: string | null;
  items: IncomeItemInput[];
}) {
  const billNumber = input.billNumber.trim();
  const items = normalizeIncomeItems(input.items);

  if (items.length === 0) {
    throw new Error("INCOME_ITEMS_REQUIRED");
  }

  return db.$transaction(async (tx) => {
    await ensureIncomeBillNumberAvailable(billNumber, undefined, tx);
    const booking = await resolveBookingSnapshot(input.bookingId, {}, tx);

    const record = await tx.incomeRecord.create({
      data: {
        incomeCode: createIncomeCode(),
        bookingId: booking?.id || null,
        customerName: input.customerName.trim() || booking?.contactName || "",
        transactionDate: parseDateOnly(input.transactionDate) ?? new Date(),
        billNumber,
        amount: sumIncomeItems(items),
        serviceDescription: buildIncomeSummaryDescription(items),
        paymentMethod: input.paymentMethod,
        notes: normalizeOptionalText(input.notes),
        items: {
          create: buildIncomeItemCreateData(items),
        },
      },
      select: {
        id: true,
      },
    });

    if (booking?.id) {
      await syncBookingPaymentStatus(booking.id, tx);
    }

    return record;
  });
}

export async function updateIncomeRecord(
  incomeId: string,
  input: {
    bookingId?: string | null;
    customerName: string;
    transactionDate: string;
    billNumber: string;
    paymentMethod: FinancePaymentMethod;
    notes?: string | null;
    items: IncomeItemInput[];
  },
) {
  const items = normalizeIncomeItems(input.items);

  if (items.length === 0) {
    throw new Error("INCOME_ITEMS_REQUIRED");
  }

  const existing = await db.incomeRecord.findUnique({
    where: { id: incomeId },
    select: {
      id: true,
      bookingId: true,
    },
  });

  if (!existing) {
    throw new Error("INCOME_NOT_FOUND");
  }

  await db.$transaction(async (tx) => {
    const trimmedBillNumber = input.billNumber.trim();
    await ensureIncomeBillNumberAvailable(trimmedBillNumber, incomeId, tx);

    const booking = await resolveBookingSnapshot(input.bookingId, {
      allowPaidBookingId: existing.bookingId,
    }, tx);

    await tx.incomeRecord.update({
      where: { id: incomeId },
      data: {
        bookingId: booking?.id || null,
        customerName: input.customerName.trim() || booking?.contactName || "",
        transactionDate: parseDateOnly(input.transactionDate) ?? new Date(),
        billNumber: trimmedBillNumber,
        amount: sumIncomeItems(items),
        serviceDescription: buildIncomeSummaryDescription(items),
        paymentMethod: input.paymentMethod,
        notes: normalizeOptionalText(input.notes),
        items: {
          deleteMany: {},
          create: buildIncomeItemCreateData(items),
        },
      },
    });

    if (existing.bookingId && existing.bookingId !== booking?.id) {
      await syncBookingPaymentStatus(existing.bookingId, tx);
    }

    if (booking?.id) {
      await syncBookingPaymentStatus(booking.id, tx);
    }
  });
}

export async function deleteIncomeRecord(incomeId: string) {
  try {
    const existing = await db.incomeRecord.findUnique({
      where: { id: incomeId },
      select: {
        bookingId: true,
      },
    });

    if (!existing) {
      throw new Error("INCOME_NOT_FOUND");
    }

    await db.$transaction(async (tx) => {
      await tx.incomeRecord.delete({
        where: { id: incomeId },
      });

      if (existing.bookingId) {
        await syncBookingPaymentStatus(existing.bookingId, tx);
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INCOME_NOT_FOUND") {
      throw error;
    }

    throw new Error("INCOME_NOT_FOUND");
  }
}

export async function listExpenseRecords(filters: {
  q?: string;
  from?: string;
  to?: string;
  page?: string;
}) {
  const page = Number.parseInt(filters.page || "1", 10);
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
  const where = buildExpenseWhere(filters);

  const [items, totalCount] = await db.$transaction([
    db.expenseRecord.findMany({
      where,
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      skip: (currentPage - 1) * expensePageSize,
      take: expensePageSize,
      select: {
        id: true,
        transactionDate: true,
        billCode: true,
        expenseType: true,
        category: true,
        amount: true,
        paymentMethod: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            description: true,
            amount: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    }),
    db.expenseRecord.count({ where }),
  ]);

  return {
    items: items.map((item) => mapExpenseRecord(item)),
    totalCount,
    page: currentPage,
    pageSize: expensePageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / expensePageSize)),
  };
}

export async function getExpenseRecord(expenseId: string) {
  const expense = await db.expenseRecord.findUnique({
    where: { id: expenseId },
    select: {
      id: true,
      transactionDate: true,
      billCode: true,
      expenseType: true,
      category: true,
      amount: true,
      paymentMethod: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      items: {
        select: {
          id: true,
          description: true,
          amount: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!expense) {
    throw new Error("EXPENSE_NOT_FOUND");
  }

  return mapExpenseRecord(expense);
}

export async function createExpenseRecord(input: {
  transactionDate: string;
  billCode: string;
  category: ExpenseCategory;
  paymentMethod?: ExpensePaymentMethod | null;
  notes?: string | null;
  items: ExpenseItemInput[];
}) {
  const billCode = input.billCode.trim().toUpperCase();
  const items = normalizeExpenseItems(input.items);

  if (items.length === 0) {
    throw new Error("EXPENSE_ITEMS_REQUIRED");
  }

  return db.$transaction(async (tx) => {
    await ensureExpenseBillCodeAvailable(billCode, undefined, tx);

    return tx.expenseRecord.create({
      data: {
        transactionDate: parseDateOnly(input.transactionDate) ?? new Date(),
        billCode,
        expenseType: buildExpenseSummaryDescription(items),
        category: input.category,
        amount: sumExpenseItems(items),
        paymentMethod: input.paymentMethod ?? ExpensePaymentMethod.OTHER,
        notes: normalizeOptionalText(input.notes),
        items: {
          create: buildExpenseItemCreateData(items),
        },
      },
      select: {
        id: true,
      },
    });
  });
}

export async function updateExpenseRecord(
  expenseId: string,
  input: {
    transactionDate: string;
    billCode: string;
    category: ExpenseCategory;
    paymentMethod?: ExpensePaymentMethod | null;
    notes?: string | null;
    items: ExpenseItemInput[];
  },
) {
  const items = normalizeExpenseItems(input.items);

  if (items.length === 0) {
    throw new Error("EXPENSE_ITEMS_REQUIRED");
  }

  const existing = await db.expenseRecord.findUnique({
    where: { id: expenseId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("EXPENSE_NOT_FOUND");
  }

  await db.$transaction(async (tx) => {
    const billCode = input.billCode.trim().toUpperCase();
    await ensureExpenseBillCodeAvailable(billCode, expenseId, tx);

    await tx.expenseRecord.update({
      where: { id: expenseId },
      data: {
        transactionDate: parseDateOnly(input.transactionDate) ?? new Date(),
        billCode,
        expenseType: buildExpenseSummaryDescription(items),
        category: input.category,
        amount: sumExpenseItems(items),
        paymentMethod: input.paymentMethod ?? ExpensePaymentMethod.OTHER,
        notes: normalizeOptionalText(input.notes),
        items: {
          deleteMany: {},
          create: buildExpenseItemCreateData(items),
        },
      },
    });
  });
}

export async function deleteExpenseRecord(expenseId: string) {
  try {
    await db.expenseRecord.delete({
      where: { id: expenseId },
    });
  } catch {
    throw new Error("EXPENSE_NOT_FOUND");
  }
}

export async function getFinanceOverview(period: FinanceOverviewPeriod = "12M") {
  const range = createFinanceOverviewRange(period);

  const [
    currentIncome,
    previousIncome,
    currentExpenses,
    previousExpenses,
    bookingStatusCounts,
    previousUnpaidCompletedCount,
    recentIncome,
    recentExpenses,
    recentPaidBookings,
  ] = await Promise.all([
    db.incomeRecord.findMany({
      where: {
        transactionDate: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: {
        id: true,
        billNumber: true,
        customerName: true,
        transactionDate: true,
        amount: true,
        paymentMethod: true,
        serviceDescription: true,
        bookingId: true,
        booking: {
          select: {
            bookingCode: true,
            status: true,
          },
        },
        items: {
          select: {
            id: true,
            amount: true,
            description: true,
            sortOrder: true,
          },
        },
        createdAt: true,
      },
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
    }),
    db.incomeRecord.findMany({
      where: {
        transactionDate: {
          gte: range.previousStart,
          lte: range.previousEnd,
        },
      },
      select: {
        amount: true,
      },
    }),
    db.expenseRecord.findMany({
      where: {
        transactionDate: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: {
        id: true,
        transactionDate: true,
        amount: true,
        expenseType: true,
        billCode: true,
        category: true,
        paymentMethod: true,
        createdAt: true,
      },
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
    }),
    db.expenseRecord.findMany({
      where: {
        transactionDate: {
          gte: range.previousStart,
          lte: range.previousEnd,
        },
      },
      select: {
        amount: true,
      },
    }),
    db.booking.groupBy({
      by: ["status"],
      where: {
        bookingDate: {
          gte: range.start,
          lte: range.end,
        },
        status: {
          in: [BookingStatus.COMPLETED, BookingStatus.PAID],
        },
      },
      _count: {
        _all: true,
      },
    }),
    db.booking.count({
      where: {
        bookingDate: {
          gte: range.previousStart,
          lte: range.previousEnd,
        },
        status: BookingStatus.COMPLETED,
      },
    }),
    db.incomeRecord.findMany({
      where: {
        transactionDate: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: {
        id: true,
        billNumber: true,
        customerName: true,
        transactionDate: true,
        amount: true,
        paymentMethod: true,
        serviceDescription: true,
        createdAt: true,
      },
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    db.expenseRecord.findMany({
      where: {
        transactionDate: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: {
        id: true,
        transactionDate: true,
        billCode: true,
        expenseType: true,
        amount: true,
        category: true,
        paymentMethod: true,
        notes: true,
        createdAt: true,
      },
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    db.booking.findMany({
      where: {
        bookingDate: {
          gte: range.start,
          lte: range.end,
        },
        status: BookingStatus.PAID,
      },
      select: {
        id: true,
        bookingCode: true,
        contactName: true,
        bookingDate: true,
        incomeRecords: {
          select: {
            amount: true,
            createdAt: true,
            items: {
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { bookingDate: "desc" }],
      take: 12,
    }),
  ]);

  const totalIncome = currentIncome.reduce((total, item) => total + mapIncomeRecord(item).amount, 0);
  const previousIncomeTotal = sumByAmount(previousIncome);
  const totalExpenses = sumByAmount(currentExpenses);
  const previousExpensesTotal = sumByAmount(previousExpenses);
  const netProfit = totalIncome - totalExpenses;
  const previousNetProfit = previousIncomeTotal - previousExpensesTotal;
  const paidBookings = bookingStatusCounts.find((item) => item.status === BookingStatus.PAID)?._count._all || 0;
  const unpaidCompletedBookings = bookingStatusCounts.find((item) => item.status === BookingStatus.COMPLETED)?._count._all || 0;
  const completedBookings = paidBookings + unpaidCompletedBookings;

  const trendLookup = new Map<string, FinanceOverviewBucket>(
    range.bucketLabels.map((bucket) => [bucket.key, {
      key: bucket.key,
      label: bucket.label,
      income: 0,
      expenses: 0,
      net: 0,
    }]),
  );

  currentIncome.forEach((item) => {
    const mapped = mapIncomeRecord(item);
    const key = getDateBucketKey(item.transactionDate, range.bucketType);
    const bucket = trendLookup.get(key);

    if (bucket) {
      bucket.income += mapped.amount;
      bucket.net = bucket.income - bucket.expenses;
    }
  });

  currentExpenses.forEach((item) => {
    const key = getDateBucketKey(item.transactionDate, range.bucketType);
    const bucket = trendLookup.get(key);

    if (bucket) {
      bucket.expenses += item.amount;
      bucket.net = bucket.income - bucket.expenses;
    }
  });

  const expenseBreakdownMap = new Map<string, { label: string; total: number }>();

  currentExpenses.forEach((item) => {
    const category = item.category ?? fallbackExpenseCategory;
    const key = category;
    const current = expenseBreakdownMap.get(key) || {
      label: getExpenseCategoryLabel(category),
      total: 0,
    };
    current.total += item.amount;
    expenseBreakdownMap.set(key, current);
  });

  const incomePaymentBreakdownMap = new Map<string, { label: string; total: number }>();

  currentIncome.forEach((item) => {
    const mapped = mapIncomeRecord(item);
    const key = mapped.paymentMethod;
    const current = incomePaymentBreakdownMap.get(key) || {
      label: getFinancePaymentMethodLabel(mapped.paymentMethod),
      total: 0,
    };
    current.total += mapped.amount;
    incomePaymentBreakdownMap.set(key, current);
  });

  const recentTransactions = [
    ...recentIncome.map((item) => {
      const mapped = mapIncomeRecord(item);

      return {
        id: `income-${item.id}`,
        date: item.transactionDate,
        type: "INCOME" as const,
        reference: mapped.billNumber,
        name: mapped.serviceDescription,
        amount: mapped.amount,
        meta: getFinancePaymentMethodLabel(mapped.paymentMethod),
        sortDate: item.createdAt,
      };
    }),
    ...recentExpenses.map((item) => {
      const mapped = mapExpenseRecord(item);

      return {
        id: `expense-${item.id}`,
        date: item.transactionDate,
        type: "EXPENSE" as const,
        reference: mapped.billCode,
        name: mapped.expenseType,
        amount: item.amount,
        meta: getExpenseCategoryLabel(mapped.category),
        sortDate: item.createdAt,
      };
    }),
  ]
    .sort((left, right) => {
      const timeDiff = new Date(right.date).getTime() - new Date(left.date).getTime();

      if (timeDiff !== 0) {
        return timeDiff;
      }

      return new Date(right.sortDate).getTime() - new Date(left.sortDate).getTime();
    })
    .slice(0, 8)
    .map(({ sortDate: _sortDate, ...item }) => item);

  const linkedPaidIncome = currentIncome.filter((item) => item.bookingId && item.booking?.status === BookingStatus.PAID);
  const linkedPaidIncomeTotal = linkedPaidIncome.reduce((total, item) => total + mapIncomeRecord(item).amount, 0);

  return {
    period,
    periodLabel: range.label,
    kpis: {
      totalIncome: {
        value: totalIncome,
        subtitle: "Selected period",
        delta: calculateDeltaPercent(totalIncome, previousIncomeTotal),
      },
      totalExpenses: {
        value: totalExpenses,
        subtitle: "Selected period",
        delta: calculateDeltaPercent(totalExpenses, previousExpensesTotal),
      },
      netProfit: {
        value: netProfit,
        subtitle: "Selected period",
        delta: calculateDeltaPercent(netProfit, previousNetProfit),
      },
      unpaidCompletedBookings: {
        value: unpaidCompletedBookings,
        subtitle: "Selected period",
        delta: calculateDeltaPercent(unpaidCompletedBookings, previousUnpaidCompletedCount),
      },
    },
    trend: {
      bucketType: range.bucketType,
      points: Array.from(trendLookup.values()),
    },
    snapshot: {
      totalIncome,
      totalExpenses,
      netProfitMargin: totalIncome > 0 ? Number(((netProfit / totalIncome) * 100).toFixed(1)) : 0,
      averageIncomePerPaidBooking: paidBookings > 0 ? Math.round(linkedPaidIncomeTotal / paidBookings) : 0,
    },
    expenseBreakdown: Array.from(expenseBreakdownMap.entries())
      .map(([key, value]) => ({
        key,
        label: value.label,
        total: value.total,
        percentage: calculatePercentage(value.total, totalExpenses),
      }))
      .sort((left, right) => right.total - left.total),
    incomePaymentBreakdown: Array.from(incomePaymentBreakdownMap.entries())
      .map(([key, value]) => ({
        key,
        label: value.label,
        total: value.total,
        percentage: calculatePercentage(value.total, totalIncome),
      }))
      .sort((left, right) => right.total - left.total),
    bookingRevenueStatus: {
      completedBookings,
      paidBookings,
      unpaidCompletedBookings,
      paidConversionRate: completedBookings > 0 ? Number(((paidBookings / completedBookings) * 100).toFixed(1)) : 0,
    },
    recentTransactions,
    recentPaidBookings: recentPaidBookings
      .map((booking) => ({
        id: booking.id,
        bookingCode: booking.bookingCode,
        customer: booking.contactName,
        paidDate: booking.incomeRecords[0]?.createdAt || booking.bookingDate,
        totalItems: booking.incomeRecords.reduce((total, income) => total + income.items.length, 0),
        totalAmount: booking.incomeRecords.reduce((total, income) => total + income.amount, 0),
      }))
      .sort((left, right) => new Date(right.paidDate).getTime() - new Date(left.paidDate).getTime())
      .slice(0, 4),
  };
}

function toCsv(rows: Array<Array<string | number>>) {
  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
}

export async function exportIncomeRecords(
  filters: Parameters<typeof listIncomeRecords>[0],
  format: "xlsx" | "csv" | "pdf",
  options: {
    preparedBy?: ExportPreparedByInput | null;
    confidentialityNote?: string | null;
  } = {},
) {
  const preset = resolveExportPreset({
    module: "finance.income",
    format,
  });
  const where = buildIncomeWhere(filters);
  const [items, branding] = await Promise.all([
    db.incomeRecord.findMany({
      where,
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      select: {
        customerName: true,
        transactionDate: true,
        billNumber: true,
        amount: true,
        serviceDescription: true,
        paymentMethod: true,
        booking: {
          select: {
            bookingCode: true,
            contactName: true,
          },
        },
        items: {
          select: {
            id: true,
            description: true,
            amount: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    }),
    buildExportBranding(),
  ]);
  const mappedItems = items.map((item) => mapIncomeRecord(item));
  const metadata = buildExportMetadata({
    preparedBy: options.preparedBy,
    confidentialityNote: options.confidentialityNote,
    reportContext: buildIncomeExportSubtitle(filters),
    preset,
  });

  const flattenedRows = flattenIncomeExportRows(
    mappedItems.map((record) => ({
      customerName: record.customerName,
      bookingCode: record.bookingCode,
      transactionDate: record.transactionDate,
      billNumber: record.billNumber,
      paymentMethod: getFinancePaymentMethodLabel(record.paymentMethod),
      items: record.items,
    })),
  );

  const rows = flattenedRows.map((row, index) => ([
    index + 1,
    row.customerName,
    row.bookingReference,
    formatDateForExport(row.transactionDate),
    row.billNumber,
    row.price,
    row.serviceDescription,
    row.paymentMethod,
  ]));

  if (format === "csv") {
    return {
      buffer: Buffer.from(
        toCsv([["No", "Customer Name", "Booking Reference", "Date", "Bill Number", "Price", "Service Description", "Payment Method"], ...rows]),
        "utf-8",
      ),
      contentType: "text/csv; charset=utf-8",
      filename: buildExportFilename({
        preset,
        moduleSlug: "income",
        format: "csv",
      }),
    };
  }

  if (format === "pdf") {
    const buffer = await renderBrandedPdfTableReport({
      branding,
      metadata,
      preset,
      reportTitle: "Income Export",
      reportSubtitle: buildIncomeExportSubtitle(filters),
      summaryLines: preset.includeSummaryBlock ? buildIncomeExportSummaryLines(mappedItems) : [],
      columns: [
        { key: "number", label: "No", width: 28, align: "right" },
        { key: "customerName", label: "Customer Name", width: 95 },
        { key: "bookingReference", label: "Booking Ref", width: 68 },
        { key: "date", label: "Date", width: 58 },
        { key: "billNumber", label: "Bill Number", width: 72 },
        { key: "price", label: "Price", width: 62, align: "right" },
        { key: "description", label: "Service Description", width: 72 },
        { key: "paymentMethod", label: "Payment Method", width: 40 },
      ],
      rows: rows.map((row) => ({
        number: String(row[0]),
        customerName: String(row[1]),
        bookingReference: String(row[2]),
        date: String(row[3]),
        billNumber: String(row[4]),
        price: formatCurrencyForExport(Number(row[5])),
        description: String(row[6]),
        paymentMethod: String(row[7]),
      })),
    });

    return {
      buffer,
      contentType: "application/pdf",
      filename: buildExportFilename({
        preset,
        moduleSlug: "income",
        format: "pdf",
      }),
    };
  }

  const columnHeaders = ["No", "Customer Name", "Booking Reference", "Date", "Bill Number", "Price", "Service Description", "Payment Method"];
  const brandedSheet = buildBrandedWorksheetData({
    reportTitle: "Income Export",
    reportSubtitle: buildIncomeExportSubtitle(filters),
    metadata,
    preset,
    summaryLines: preset.includeSummaryBlock ? buildIncomeExportSummaryLines(mappedItems) : [],
    tableHeaders: columnHeaders,
    rows: rows.map((row) => [
      row[0],
      row[1],
      row[2],
      row[3],
      row[4],
      formatCurrencyForExport(Number(row[5])),
      row[6],
      row[7],
    ]),
  }, branding);
  const sheet = XLSX.utils.aoa_to_sheet(brandedSheet.data);
  sheet["!cols"] = [{ wch: 6 }, { wch: 24 }, { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 28 }, { wch: 20 }];
  applyBrandedWorksheetLayout(sheet, {
    columnCount: columnHeaders.length,
    header: brandedSheet.header,
    tableHeaderRowIndex: brandedSheet.tableHeaderRowIndex,
  });

  const workbook = XLSX.utils.book_new();
  applyWorkbookBranding(workbook, branding, {
    title: "Income Export",
    subject: "Finance income export",
    metadata,
    preset,
  });
  XLSX.utils.book_append_sheet(workbook, sheet, "Income");

  return {
    buffer: Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })),
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    filename: buildExportFilename({
      preset,
      moduleSlug: "income",
      format: "xlsx",
    }),
  };
}

export async function exportExpenseRecords(
  filters: Parameters<typeof listExpenseRecords>[0],
  format: "xlsx" | "csv" | "pdf",
  options: {
    preparedBy?: ExportPreparedByInput | null;
    confidentialityNote?: string | null;
  } = {},
) {
  const preset = resolveExportPreset({
    module: "finance.expenses",
    format,
  });
  const where = buildExpenseWhere(filters);
  const [items, branding] = await Promise.all([
    db.expenseRecord.findMany({
      where,
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      select: {
        transactionDate: true,
        billCode: true,
        expenseType: true,
        category: true,
        amount: true,
        paymentMethod: true,
        notes: true,
        items: {
          select: {
            id: true,
            description: true,
            amount: true,
            sortOrder: true,
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    }),
    buildExportBranding(),
  ]);
  const mappedItems = items.map((item) => mapExpenseRecord(item));
  const metadata = buildExportMetadata({
    preparedBy: options.preparedBy,
    confidentialityNote: options.confidentialityNote,
    reportContext: buildExpenseExportSubtitle(filters),
    preset,
  });

  const flattenedRows = flattenExpenseExportRows(
    mappedItems.map((record) => ({
      transactionDate: record.transactionDate,
      billCode: record.billCode,
      expenseType: record.expenseType,
      category: getExpenseCategoryLabel(record.category),
      paymentMethod: getExpensePaymentMethodLabel(record.paymentMethod),
      notes: record.notes,
      items: record.items,
    })),
  );

  const rows = flattenedRows.map((row, index) => ([
    index + 1,
    formatDateForExport(row.transactionDate),
    row.billCode,
    row.expenseItem,
    row.category,
    row.amount,
    row.paymentMethod,
    row.notes,
  ]));

  if (format === "csv") {
    return {
      buffer: Buffer.from(
        toCsv([["No", "Date", "Bill Code", "Expense Name", "Category", "Amount", "Payment Method", "Notes"], ...rows]),
        "utf-8",
      ),
      contentType: "text/csv; charset=utf-8",
      filename: buildExportFilename({
        preset,
        moduleSlug: "expenses",
        format: "csv",
      }),
    };
  }

  if (format === "pdf") {
    const buffer = await renderBrandedPdfTableReport({
      branding,
      metadata,
      preset,
      reportTitle: "Expense Export",
      reportSubtitle: buildExpenseExportSubtitle(filters),
      summaryLines: preset.includeSummaryBlock ? buildExpenseExportSummaryLines(mappedItems) : [],
      columns: [
        { key: "number", label: "No", width: 28, align: "right" },
        { key: "date", label: "Date", width: 58 },
        { key: "billCode", label: "Bill Code", width: 62 },
        { key: "expenseName", label: "Expense Item", width: 110 },
        { key: "category", label: "Category", width: 62 },
        { key: "amount", label: "Amount", width: 64, align: "right" },
        { key: "paymentMethod", label: "Method", width: 46 },
        { key: "notes", label: "Notes", width: 65 },
      ],
      rows: rows.map((row) => ({
        number: String(row[0]),
        date: String(row[1]),
        billCode: String(row[2]),
        expenseName: String(row[3]),
        category: String(row[4]),
        amount: formatCurrencyForExport(Number(row[5])),
        paymentMethod: String(row[6]),
        notes: String(row[7]),
      })),
    });

    return {
      buffer,
      contentType: "application/pdf",
      filename: buildExportFilename({
        preset,
        moduleSlug: "expenses",
        format: "pdf",
      }),
    };
  }

  const columnHeaders = ["No", "Date", "Bill Code", "Expense Item", "Category", "Amount", "Payment Method", "Notes"];
  const brandedSheet = buildBrandedWorksheetData({
    reportTitle: "Expense Export",
    reportSubtitle: buildExpenseExportSubtitle(filters),
    metadata,
    preset,
    summaryLines: preset.includeSummaryBlock ? buildExpenseExportSummaryLines(mappedItems) : [],
    tableHeaders: columnHeaders,
    rows: rows.map((row) => [
      row[0],
      row[1],
      row[2],
      row[3],
      row[4],
      formatCurrencyForExport(Number(row[5])),
      row[6],
      row[7],
    ]),
  }, branding);
  const sheet = XLSX.utils.aoa_to_sheet(brandedSheet.data);
  sheet["!cols"] = [{ wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 32 }];
  applyBrandedWorksheetLayout(sheet, {
    columnCount: columnHeaders.length,
    header: brandedSheet.header,
    tableHeaderRowIndex: brandedSheet.tableHeaderRowIndex,
  });

  const workbook = XLSX.utils.book_new();
  applyWorkbookBranding(workbook, branding, {
    title: "Expense Export",
    subject: "Finance expense export",
    metadata,
    preset,
  });
  XLSX.utils.book_append_sheet(workbook, sheet, "Expenses");

  return {
    buffer: Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })),
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    filename: buildExportFilename({
      preset,
      moduleSlug: "expenses",
      format: "xlsx",
    }),
  };
}
