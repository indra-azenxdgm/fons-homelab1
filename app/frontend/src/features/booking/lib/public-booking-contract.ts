import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

import { bookingSchema } from "@/features/booking/lib/booking-schema";

export const publicBookingAvailabilityQuerySchema = z.strictObject({
  date: bookingSchema.shape.bookingDate,
});

export const publicReverseGeocodeQuerySchema = z.strictObject({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const publicBookingRequestSchema = bookingSchema.strict();

export const publicAvailabilitySlotSchema = z.object({
  value: z.string(),
  label: z.string(),
  available: z.boolean(),
  remainingCapacity: z.number().int().min(0).optional(),
  overrideStatus: z.enum(["OPEN", "FULL_BOOKED", "CLOSED"]).nullable().optional(),
  overrideReason: z.string().nullable().optional(),
  isManualOverride: z.boolean().optional(),
  unavailableReason: z.enum(["invalid_date", "day_override", "slot_override", "capacity_full"]).nullable().optional(),
  isCapacityFull: z.boolean().optional(),
});

export type PublicBookingAvailabilityQuery = z.infer<
  typeof publicBookingAvailabilityQuerySchema
>;
export type PublicReverseGeocodeQuery = z.infer<
  typeof publicReverseGeocodeQuerySchema
>;
export type PublicBookingRequest = z.output<typeof publicBookingRequestSchema>;
export type PublicAvailabilitySlot = z.infer<typeof publicAvailabilitySlotSchema>;

type PublicApiSuccess<T> = {
  ok: true;
  data: T;
};

type PublicApiError = {
  ok: false;
  error: {
    category: "validation" | "conflict" | "rate_limit" | "security" | "system";
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
};

export function publicApiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<PublicApiSuccess<T>>(
    {
      ok: true,
      data,
    },
    { status },
  );
}

export function publicApiError(input: {
  status: number;
  category: "validation" | "conflict" | "rate_limit" | "security" | "system";
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
}) {
  return NextResponse.json<PublicApiError>(
    {
      ok: false,
      error: {
        category: input.category,
        code: input.code,
        message: input.message,
        fieldErrors: input.fieldErrors,
        formErrors: input.formErrors,
      },
    },
    { status: input.status },
  );
}

export function publicApiValidationError(
  error: ZodError,
  message = "Input publik tidak valid.",
) {
  const flattened = error.flatten();

  return publicApiError({
    status: 400,
    category: "validation",
    code: "invalid_request",
    message,
    fieldErrors: Object.keys(flattened.fieldErrors).length
      ? flattened.fieldErrors
      : undefined,
    formErrors: flattened.formErrors.length ? flattened.formErrors : undefined,
  });
}
