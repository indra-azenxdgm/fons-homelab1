import type { Request, Response } from "express";

import { sendZodValidationError } from "@/controllers/controller-helpers";
import { getCalendarMonth, getCalendarServiceTypes } from "@/services/calendar.service";
import { calendarQuerySchema } from "@/validation/api-schemas";

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
