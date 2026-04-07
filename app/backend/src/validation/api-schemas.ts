import { AdminRole, ExpenseCategory, ExpensePaymentMethod, FinancePaymentMethod } from "@prisma/client";
import { z } from "zod";

import { bookingStatusOptions } from "@/services/bookings.service";

const queryValue = (schema: z.ZodTypeAny) =>
  z.preprocess((value) => Array.isArray(value) ? value[0] : value, schema);

const optionalTrimmed = queryValue(z.string().trim().min(1).optional());
const optionalDate = queryValue(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional());
const optionalMonth = queryValue(z.string().regex(/^\d{4}-\d{2}$/).optional());
const optionalPage = queryValue(z.coerce.number().int().positive().max(999).optional());
const optionalBookingStatus = queryValue(z.enum(bookingStatusOptions as [string, ...string[]]).optional());
const optionalFinancePaymentMethod = queryValue(z.nativeEnum(FinancePaymentMethod).optional());

export const bookingIdParamSchema = z.object({
  bookingId: z.string().trim().min(1),
});

export const customerIdParamSchema = z.object({
  customerId: z.string().trim().min(1),
});

export const squadIdParamSchema = z.object({
  squadId: z.string().trim().min(1),
});

export const userIdParamSchema = z.object({
  userId: z.string().trim().min(1),
});

export const financeIncomeIdParamSchema = z.object({
  incomeId: z.string().trim().min(1),
});

export const financeExpenseIdParamSchema = z.object({
  expenseId: z.string().trim().min(1),
});

export const adminNotificationIdParamSchema = z.object({
  notificationId: z.string().trim().min(1),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const adminBookingPatchSchema = z.object({
  status: z.enum(bookingStatusOptions as [string, ...string[]]),
  assignedSquadIds: z.array(z.string().trim().min(1)).optional().default([]),
});

export const bookingListQuerySchema = z.object({
  q: optionalTrimmed,
  date: optionalDate,
  status: optionalBookingStatus,
  assignedSquadId: optionalTrimmed,
  serviceTypeId: optionalTrimmed,
  page: optionalPage,
});

export const calendarQuerySchema = z.object({
  q: optionalTrimmed,
  month: optionalMonth,
  day: optionalDate,
  view: queryValue(z.enum(["day", "week", "month"]).optional()),
  status: optionalBookingStatus,
  assignedSquadId: optionalTrimmed,
  serviceTypeId: optionalTrimmed,
});

export const customerListQuerySchema = z.object({
  q: optionalTrimmed,
  activity: queryValue(z.enum(["with_bookings", "without_bookings"]).optional()),
  page: optionalPage,
});

export const adminUserListQuerySchema = z.object({
  q: optionalTrimmed,
  role: queryValue(z.nativeEnum(AdminRole).optional()),
  status: queryValue(z.enum(["active", "inactive"]).optional()),
  page: optionalPage,
});

export const financeBookingLookupQuerySchema = z.object({
  q: optionalTrimmed,
  limit: queryValue(z.coerce.number().int().positive().max(50).optional()),
});

export const financeOverviewQuerySchema = z.object({
  period: queryValue(z.enum(["7D", "30D", "3M", "12M"]).optional()),
});

export const financeIncomeListQuerySchema = z.object({
  q: optionalTrimmed,
  from: optionalDate,
  to: optionalDate,
  paymentMethod: optionalFinancePaymentMethod,
  bookingLink: queryValue(z.enum(["linked", "manual"]).optional()),
  page: optionalPage,
  format: queryValue(z.enum(["xlsx", "csv", "pdf"]).optional()),
});

export const financeExpenseListQuerySchema = z.object({
  q: optionalTrimmed,
  from: optionalDate,
  to: optionalDate,
  page: optionalPage,
  format: queryValue(z.enum(["xlsx", "csv", "pdf"]).optional()),
});

export const adminNotificationListQuerySchema = z.object({
  status: queryValue(z.enum(["read", "unread"]).optional()),
  view: queryValue(z.enum(["active", "archived"]).optional()),
  limit: queryValue(z.coerce.number().int().positive().max(50).optional()),
  page: optionalPage,
});

export const adminNotificationBulkActionSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1).optional().default([]),
});

export const adminNotificationBulkArchiveSchema = z.object({
  ids: z.array(z.string().trim().min(1)).optional().default([]),
  readOnly: z.boolean().optional().default(false),
}).refine((value) => value.readOnly || value.ids.length > 0, {
  message: "Select at least one notification or use readOnly archive mode.",
  path: ["ids"],
});

export const adminNotificationPreferencesPatchSchema = z.object({
  toastEnabled: z.boolean(),
  soundEnabled: z.boolean(),
  typePreferences: z.object({
    BOOKING_CREATED: z.boolean().optional(),
    BOOKING_STATUS_CHANGED: z.boolean().optional(),
    BOOKING_SQUADS_UPDATED: z.boolean().optional(),
    BOOKING_ATTENTION_REQUIRED: z.boolean().optional(),
  }),
});

export const adminNotificationRulesPatchSchema = z.object({
  digestCadence: z.enum(["daily", "weekly"]),
  eventTypeEnabled: z.object({
    BOOKING_CREATED: z.boolean(),
    BOOKING_STATUS_CHANGED: z.boolean(),
    BOOKING_SQUADS_UPDATED: z.boolean(),
    BOOKING_ATTENTION_REQUIRED: z.boolean(),
  }),
  sla: z.object({
    enabled: z.boolean(),
    pendingHours: z.coerce.number().int().min(1).max(168),
    confirmedHours: z.coerce.number().int().min(1).max(168),
    assignedHours: z.coerce.number().int().min(1).max(168),
    inProgressHours: z.coerce.number().int().min(1).max(168),
  }),
});

export const squadListQuerySchema = z.object({
  q: optionalTrimmed,
  status: queryValue(z.enum(["active", "inactive"]).optional()),
  page: optionalPage,
});

export const adminUserRolePatchSchema = z.object({
  role: z.nativeEnum(AdminRole),
  isActive: z.boolean(),
});

export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(160),
  role: z.nativeEnum(AdminRole),
  isActive: z.boolean().default(true),
});

export const financeIncomeUpsertSchema = z.object({
  bookingId: z.string().trim().min(1).optional().nullable(),
  customerName: z.string().trim().min(1).max(160),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  billNumber: z.string().trim().min(1).max(80),
  paymentMethod: z.nativeEnum(FinancePaymentMethod),
  notes: z.string().trim().max(1000).optional().nullable().or(z.literal("")),
  items: z.array(z.object({
    description: z.string().trim().min(1).max(240),
    amount: z.coerce.number().int().positive().max(999_999_999),
  })).min(1),
});

export const financeExpenseUpsertSchema = z.object({
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  billCode: z.string().trim().min(1).max(40),
  category: z.nativeEnum(ExpenseCategory),
  paymentMethod: z.nativeEnum(ExpensePaymentMethod).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable().or(z.literal("")),
  items: z.array(z.object({
    description: z.string().trim().min(1).max(240),
    amount: z.coerce.number().int().positive().max(999_999_999),
  })).min(1),
});

const optionalProfileText = z.string().trim().max(240).optional().nullable().or(z.literal(""));

export const companyProfileUpsertSchema = z.object({
  companyName: z.string().trim().min(1).max(160),
  companyTagline: z.string().trim().max(160).optional().nullable().or(z.literal("")),
  address: z.string().trim().max(500).optional().nullable().or(z.literal("")),
  phone: optionalProfileText,
  email: z.string().trim().email().max(160).optional().nullable().or(z.literal("")),
  website: z.string().trim().max(200).optional().nullable().or(z.literal("")).refine((value) => {
    if (!value) {
      return true;
    }

    return /^https?:\/\/.+/i.test(value) || /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(value);
  }, {
    message: "Enter a valid website URL",
  }),
  logoUrl: z.string().trim().max(500).optional().nullable().or(z.literal("")),
});

export const adminUserPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
  confirmPassword: z.string().min(1),
}).refine((value) => value.newPassword === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Password confirmation does not match",
});

export const squadCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.email().max(120).optional().nullable().or(z.literal("")),
});

export const dateQuerySchema = z.object({
  date: queryValue(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const reverseGeocodeQuerySchema = z.object({
  lat: queryValue(z.coerce.number().min(-90).max(90)),
  lng: queryValue(z.coerce.number().min(-180).max(180)),
});
