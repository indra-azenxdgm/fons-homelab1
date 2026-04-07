import { z } from "zod";

import { TIME_SLOT_VALUES } from "@/features/booking/constants";
import {
  isAllowedMapsUrl,
  normalizeEmail,
  normalizeMapsUrl,
  normalizePhoneNumber,
  sanitizeFreeText,
} from "@/features/booking/lib/booking-sanitize";

function getLocalDateString() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function parseOptionalCoordinate(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);

    return Number.isFinite(parsed) ? parsed : value;
  }

  return value;
}

function parseStartedAt(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && /^\d{10,15}$/.test(value.trim())) {
    return Number(value.trim());
  }

  return value;
}

export const bookingSchema = z.object({
  serviceTypeId: z.string().min(1, "Pilih layanan terlebih dahulu"),
  bookingDate: z
    .string()
    .min(1, "Pilih tanggal servis")
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), "Masukkan tanggal yang valid")
    .refine((value) => value >= getLocalDateString(), "Tanggal servis tidak boleh di masa lalu"),
  timeSlot: z.enum(TIME_SLOT_VALUES, "Pilih jam yang masih tersedia"),
  name: z
    .string()
    .transform((value) => sanitizeFreeText(value))
    .pipe(
      z
        .string()
        .min(2, "Masukkan nama lengkap")
        .max(80, "Nama lengkap terlalu panjang"),
    ),
  phone: z
    .string()
    .transform((value) => normalizePhoneNumber(value))
    .pipe(
      z
        .string()
        .min(10, "Masukkan nomor HP yang valid")
        .max(16, "Nomor HP terlalu panjang")
        .regex(/^62\d+$/, "Gunakan nomor HP yang valid, misalnya 0812... atau +62812..."),
    ),
  email: z
    .string()
    .transform((value) => normalizeEmail(value))
    .pipe(
      z
        .string()
        .min(1, "Masukkan alamat email")
        .email("Masukkan alamat email yang valid")
        .max(120, "Alamat email terlalu panjang"),
    ),
  address: z
    .string()
    .transform((value) => sanitizeFreeText(value))
    .pipe(
      z
        .string()
        .min(8, "Masukkan alamat servis")
        .max(280, "Alamat servis terlalu panjang"),
    ),
  mapsUrl: z
    .string()
    .transform((value) => normalizeMapsUrl(value))
    .pipe(
      z.union([
        z.literal(""),
        z
          .string()
          .url("Masukkan link Google Maps yang valid")
          .max(500, "Link Google Maps terlalu panjang")
          .refine(
            (value) => isAllowedMapsUrl(value),
            "Gunakan link Google Maps yang valid",
          ),
      ]),
    )
    .optional()
    .or(z.literal("")),
  latitude: z.preprocess(
    parseOptionalCoordinate,
    z
      .number()
      .finite("Latitude tidak valid")
      .min(-90, "Latitude tidak valid")
      .max(90, "Latitude tidak valid")
      .optional(),
  ),
  longitude: z.preprocess(
    parseOptionalCoordinate,
    z
      .number()
      .finite("Longitude tidak valid")
      .min(-180, "Longitude tidak valid")
      .max(180, "Longitude tidak valid")
      .optional(),
  ),
  notes: z
    .string()
    .transform((value) => sanitizeFreeText(value))
    .pipe(z.string().max(500, "Catatan tambahan terlalu panjang"))
    .optional()
    .or(z.literal("")),
  serviceVariant: z
    .string()
    .transform((value) => sanitizeFreeText(value))
    .pipe(z.string().max(120, "Pilihan tipe AC terlalu panjang"))
    .optional()
    .or(z.literal("")),
  repairIssue: z
    .string()
    .transform((value) => sanitizeFreeText(value))
    .pipe(z.string().max(120, "Jenis kendala terlalu panjang"))
    .optional()
    .or(z.literal("")),
  serviceComplaint: z
    .string()
    .transform((value) => sanitizeFreeText(value))
    .pipe(z.string().max(500, "Detail keluhan terlalu panjang"))
    .optional()
    .or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
  startedAt: z.preprocess(
    parseStartedAt,
    z
      .number()
      .int("Sesi form tidak valid")
      .positive("Sesi form tidak valid"),
  ),
  submissionKey: z.string().uuid("Silakan muat ulang halaman lalu coba lagi"),
  turnstileToken: z.string().optional().or(z.literal("")),
}).superRefine((values, context) => {
  const hasLatitude = typeof values.latitude === "number";
  const hasLongitude = typeof values.longitude === "number";

  if (hasLatitude !== hasLongitude) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: hasLatitude ? ["longitude"] : ["latitude"],
      message: "Koordinat lokasi belum lengkap",
    });
  }

  if (!Number.isFinite(values.startedAt) || values.startedAt <= 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["startedAt"],
      message: "Sesi form tidak valid",
    });
  }
});

export type BookingFormValues = z.input<typeof bookingSchema>;
export type ParsedBookingFormValues = z.output<typeof bookingSchema>;
