import type { Request, Response } from "express";

import { sendZodValidationError } from "@/controllers/controller-helpers";
import { getAuthenticatedAdmin } from "@/middleware/auth";
import { getCalendarMonth, getCalendarServiceTypes, updateCalendarDayOverride, updateCalendarSlotOverride } from "@/services/calendar.service";
import { bookingDayOverrideUpsertSchema, bookingSlotOverrideUpsertSchema, calendarQuerySchema } from "@/validation/api-schemas";

export async function getAdminCalendar(request: Request, response: Response) {
  const parsedQuery = calendarQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    sendZodValidationError(response, parsedQuery.error, "Calendar filters are not valid.");
    return;
  }

  const filters = Object.fromEntries(
    Object.entries(parsedQuery.data).map(([key, value]) => [key, value == null ? undefined : String(value)]),
  ) as Record<string, string | undefined>;

  response.json(await getCalendarMonth(filters));
}

export async function getAdminServiceTypes(_request: Request, response: Response) {
  response.json({ serviceTypes: await getCalendarServiceTypes() });
}

export async function patchAdminCalendarDayOverride(request: Request, response: Response) {
  const parsedBody = bookingDayOverrideUpsertSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "Calendar day status is not valid.");
    return;
  }

  const adminUser = getAuthenticatedAdmin(response);

  if (!adminUser) {
    throw new Error("UNAUTHORIZED_ADMIN");
  }

  response.json({
    success: true,
    ...(await updateCalendarDayOverride({
      date: parsedBody.data.date,
      status: parsedBody.data.status,
      reason: parsedBody.data.reason,
      actingAdminUserId: adminUser.id,
    })),
  });
}

export async function patchAdminCalendarSlotOverride(request: Request, response: Response) {
  const parsedBody = bookingSlotOverrideUpsertSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "Calendar slot status is not valid.");
    return;
  }

  const adminUser = getAuthenticatedAdmin(response);

  if (!adminUser) {
    throw new Error("UNAUTHORIZED_ADMIN");
  }

  response.json({
    success: true,
    ...(await updateCalendarSlotOverride({
      date: parsedBody.data.date,
      timeSlot: parsedBody.data.timeSlot,
      status: parsedBody.data.status,
      reason: parsedBody.data.reason,
      actingAdminUserId: adminUser.id,
    })),
  });
}
