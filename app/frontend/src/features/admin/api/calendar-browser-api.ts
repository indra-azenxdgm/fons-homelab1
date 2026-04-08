"use client";

import type { BookingDayStatus } from "@/features/booking/constants";
import { BackendApiError, fetchBackendJson } from "@/lib/api-client";

function getFrontendOrigin() {
  return window.location.origin;
}

export async function patchAdminCalendarDayOverrideBrowser(input: {
  date: string;
  status: BookingDayStatus;
  reason?: string | null;
}) {
  return fetchBackendJson<{
    success: true;
    previousStatus: BookingDayStatus;
    override: {
      date: string;
      status: BookingDayStatus;
      reason: string | null;
      message: string | null;
    };
  }>("/api/admin/calendar/day-override", {
    baseUrl: getFrontendOrigin(),
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export { BackendApiError };
