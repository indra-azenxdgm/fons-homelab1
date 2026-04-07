import type { Request, Response } from "express";

import {
  createApiError,
  formatDisplayName,
  getRouteParam,
  sendApiError,
  sendPublicSuccess,
  sendZodValidationError,
} from "@/controllers/controller-helpers";
import { getAuthenticatedAdmin } from "@/middleware/auth";
import {
  bookingSchema,
  bookingStatusOptions,
  BookingCapacityError,
  BookingDuplicateActiveError,
  BookingValidationError,
  createBooking,
  getAdminBookingDetail,
  getAdminBookings,
  getAdminDashboardOverview,
  getAdminServiceTypes,
  getAvailableSlots,
  getBookingByCode,
  getBookingBySubmissionKey,
  getBookingFormData,
  updateAdminBooking,
} from "@/services/bookings.service";
import { getSquadLookup } from "@/services/squads.service";
import {
  BookingSecurityError,
  enforceBookingRateLimit,
  getRequestSecurityContext,
  logBookingSecurityEvent,
  rejectHoneypotAttempt,
  rejectTooFastSubmission,
  verifyTurnstileToken,
} from "@/features/booking/lib/booking-security";
import {
  PUBLIC_RATE_LIMIT_POLICIES,
  PublicRateLimitError,
  enforcePublicRateLimit,
} from "@/features/booking/lib/public-rate-limit";
import { normalizePhoneNumber } from "@/features/booking/lib/booking-sanitize";
import {
  adminBookingPatchSchema,
  bookingIdParamSchema,
  bookingListQuerySchema,
  dateQuerySchema,
  reverseGeocodeQuerySchema,
} from "@/validation/api-schemas";

export async function getPublicBookingForm(_request: Request, response: Response) {
  response.json(await getBookingFormData());
}

export async function getPublicBookingByCode(request: Request, response: Response) {
  const code = typeof request.query.code === "string" ? request.query.code : "";
  const booking = code ? await getBookingByCode(code) : null;
  response.json({ booking });
}

export async function getPublicBookingAvailability(request: Request, response: Response) {
  const requestLike = new Request(`http://internal${request.originalUrl}`, {
    headers: request.headers as unknown as HeadersInit,
  });
  const context = getRequestSecurityContext(requestLike);

  try {
    enforcePublicRateLimit(requestLike, PUBLIC_RATE_LIMIT_POLICIES.bookingAvailability);
  } catch (error) {
    if (error instanceof PublicRateLimitError) {
      await logBookingSecurityEvent({
        outcome: "rejected",
        reason: "availability_rate_limited",
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        payload: {
          route: "/api/public/booking-availability",
        },
      });

      sendApiError(response, {
        status: error.status,
        category: "rate_limit",
        code: error.code,
        message: error.message,
      });
      return;
    }

    throw error;
  }

    const parsedQuery = dateQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    await logBookingSecurityEvent({
      outcome: "rejected",
      reason: "availability_validation_failed",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    sendZodValidationError(response, parsedQuery.error, "Tanggal booking tidak valid.");
    return;
  }

  const slots = await getAvailableSlots(String(parsedQuery.data.date));
  sendPublicSuccess(response, { slots });
}

export async function createPublicBooking(request: Request, response: Response) {
  const requestLike = new Request("http://internal/api/public/bookings", {
    method: "POST",
    headers: request.headers as unknown as HeadersInit,
  });
  const context = getRequestSecurityContext(requestLike);
  const payload =
    typeof request.body === "object" && request.body !== null
      ? request.body as Record<string, unknown>
      : undefined;

  try {
    const submissionKey =
      typeof payload?.submissionKey === "string" ? payload.submissionKey : null;

    if (submissionKey) {
      const existingBooking = await getBookingBySubmissionKey(submissionKey);

      if (existingBooking) {
        sendPublicSuccess(response, {
          bookingCode: existingBooking.bookingCode,
          idempotency: "replayed",
        });
        return;
      }
    }

    await rejectHoneypotAttempt({
      website: typeof payload?.website === "string" ? payload.website : null,
      phone: typeof payload?.phone === "string" ? normalizePhoneNumber(payload.phone) : null,
      submissionKey,
      payload,
      context,
    });

    await rejectTooFastSubmission({
      startedAt:
        typeof payload?.startedAt === "number"
          ? payload.startedAt
          : typeof payload?.startedAt === "string"
            ? Number(payload.startedAt)
            : null,
      phone: typeof payload?.phone === "string" ? normalizePhoneNumber(payload.phone) : null,
      submissionKey,
      payload,
      context,
    });

    await enforceBookingRateLimit(requestLike);
    await verifyTurnstileToken(
      typeof payload?.turnstileToken === "string" ? payload.turnstileToken : null,
      context,
    );

    const parsedRequest = bookingSchema.strict().safeParse(request.body);

    if (!parsedRequest.success) {
      sendZodValidationError(response, parsedRequest.error, "Silakan lengkapi dan periksa kembali data booking Anda.");
      return;
    }

    const result = await createBooking(parsedRequest.data);

    await logBookingSecurityEvent({
      outcome: "accepted",
      reason: result.wasCreated ? "booking_created" : "booking_replayed",
      ipAddress: context.ipAddress,
      phone: parsedRequest.data.phone,
      userAgent: context.userAgent,
      submissionKey: parsedRequest.data.submissionKey,
    });

    sendPublicSuccess(response, {
      bookingCode: result.booking.bookingCode,
      idempotency: result.wasCreated ? "created" : "replayed",
    }, result.wasCreated ? 201 : 200);
  } catch (error) {
    if (error instanceof BookingSecurityError) {
      sendApiError(response, {
        status: error.status,
        category: "security",
        code: error.code,
        message: error.message,
        fieldErrors: error.fieldErrors,
      });
      return;
    }

    if (error instanceof PublicRateLimitError) {
      sendApiError(response, {
        status: error.status,
        category: "rate_limit",
        code: error.code,
        message: error.message,
      });
      return;
    }

    if (error instanceof BookingCapacityError) {
      sendApiError(response, {
        status: 409,
        category: "conflict",
        code: "slot_unavailable",
        message: error.message,
        fieldErrors: {
          timeSlot: [error.message],
        },
      });
      return;
    }

    if (error instanceof BookingValidationError) {
      sendApiError(response, {
        status: 400,
        category: "validation",
        code: "invalid_request",
        message: error.message,
        fieldErrors: error.fieldErrors,
      });
      return;
    }

    if (error instanceof BookingDuplicateActiveError) {
      sendApiError(response, {
        status: 409,
        category: "conflict",
        code: "duplicate_active_booking",
        message: error.message,
        fieldErrors: {
          phone: [error.message],
          timeSlot: [error.message],
        },
      });
      return;
    }

    throw error;
  }
}

export async function reverseGeocode(request: Request, response: Response) {
  const requestLike = new Request(`http://internal${request.originalUrl}`, {
    headers: request.headers as unknown as HeadersInit,
  });
  const context = getRequestSecurityContext(requestLike);
  const parsedQuery = reverseGeocodeQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    sendZodValidationError(response, parsedQuery.error, "Koordinat lokasi tidak valid.");
    return;
  }

  try {
    enforcePublicRateLimit(requestLike, PUBLIC_RATE_LIMIT_POLICIES.reverseGeocode);
  } catch (error) {
    if (error instanceof PublicRateLimitError) {
        sendApiError(response, {
          status: error.status,
          category: "rate_limit",
          code: error.code,
        message: error.message,
      });
      return;
    }

    throw error;
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(parsedQuery.data.lat));
  url.searchParams.set("lon", String(parsedQuery.data.lng));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "id");

  try {
    const geocodeResponse = await fetch(url, {
      headers: {
        "User-Agent": "FonsBooking/1.0",
      },
    });

    if (!geocodeResponse.ok) {
      throw new Error("reverse_geocode_failed");
    }

    const data = await geocodeResponse.json() as { display_name?: string };
    sendPublicSuccess(response, {
      address: data.display_name ? formatDisplayName(data.display_name) : null,
    });
  } catch {
    await logBookingSecurityEvent({
      outcome: "rejected",
      reason: "reverse_geocode_failed",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    sendApiError(response, {
      status: 502,
      category: "system",
      code: "reverse_geocode_failed",
      message: "Alamat otomatis belum bisa dibuat.",
    });
  }
}

export async function getDashboardOverview(_request: Request, response: Response) {
  const adminUser = getAuthenticatedAdmin(response);

  if (!adminUser) {
    throw createApiError({
      status: 401,
      category: "security",
      code: "unauthorized_admin",
      message: "Unauthorized",
    });
  }

  response.json(await getAdminDashboardOverview(adminUser.id));
}

export async function listAdminBookings(request: Request, response: Response) {
  const parsedQuery = bookingListQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    sendZodValidationError(response, parsedQuery.error, "Booking filters are not valid.");
    return;
  }

  const filters = Object.fromEntries(
    Object.entries(parsedQuery.data).map(([key, value]) => [key, value == null ? undefined : String(value)]),
  ) as Record<string, string | undefined>;
  const [bookings, squads, serviceTypes] = await Promise.all([
    getAdminBookings(filters),
    getSquadLookup(),
    getAdminServiceTypes(),
  ]);

  response.json({
    ...bookings,
    squads,
    serviceTypes,
    statusOptions: bookingStatusOptions,
  });
}

export async function getAdminBooking(request: Request, response: Response) {
  const parsedParams = bookingIdParamSchema.safeParse({ bookingId: getRouteParam(request, "bookingId") });

  if (!parsedParams.success) {
    sendZodValidationError(response, parsedParams.error, "Booking id is not valid.");
    return;
  }

  const booking = await getAdminBookingDetail(parsedParams.data.bookingId);

  if (!booking) {
    throw createApiError({
      status: 404,
      category: "validation",
      code: "booking_not_found",
      message: "Booking not found",
    });
    return;
  }

  const adminUser = getAuthenticatedAdmin(response);
  const canUpdate = adminUser?.role === "SUPER_ADMIN" || adminUser?.role === "ADMIN";
  const squads = canUpdate ? await getSquadLookup() : [];

  response.json({
    booking,
    squads,
    statusOptions: bookingStatusOptions,
  });
}

export async function patchAdminBooking(request: Request, response: Response) {
  const parsedParams = bookingIdParamSchema.safeParse({ bookingId: getRouteParam(request, "bookingId") });

  if (!parsedParams.success) {
    sendZodValidationError(response, parsedParams.error, "Booking id is not valid.");
    return;
  }

  const parsedBody = adminBookingPatchSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "Choose a valid booking status.");
    return;
  }

  const adminUser = getAuthenticatedAdmin(response);

  if (!adminUser) {
    throw createApiError({
      status: 401,
      category: "security",
      code: "unauthorized_admin",
      message: "Unauthorized",
    });
    return;
  }

  const result = await updateAdminBooking({
    bookingId: parsedParams.data.bookingId,
    status: parsedBody.data.status as (typeof bookingStatusOptions)[number],
    assignedSquadIds: parsedBody.data.assignedSquadIds,
    adminUserId: adminUser.id,
  });

  response.json({
    success: true,
    booking: result,
  });
}
