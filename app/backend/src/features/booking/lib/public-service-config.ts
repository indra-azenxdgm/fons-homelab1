import { sanitizeFreeText } from "@/features/booking/lib/booking-sanitize";

export const SERVICE_TYPE_SLUGS = {
  CLEANING: "ac-cleaning",
  REPAIR: "ac-repair",
  INSTALLATION: "ac-installation",
  GAS_REFILL: "ac-gas-refill",
  RELOCATION: "ac-maintenance",
  OTHER: "ac-other",
} as const;

export const CLEANING_VARIANTS = [
  "AC Split - 0.5 PK",
  "AC Split - 3/4 PK",
  "AC Split - 1 PK",
  "AC Split - 1.5 PK",
  "AC Split - 2 PK",
  "AC Split - 2.5 PK",
  "AC Cassette - 2 PK",
  "AC Cassette - 3 PK",
  "AC Cassette - 5 PK",
  "AC Standing - 3 PK",
  "AC Standing - 5 PK",
] as const;

export const REPAIR_ISSUES = [
  "AC Panas",
  "AC tidak bisa dimatikan",
  "Lainnya",
] as const;

type BookingServiceType = {
  name: string;
  slug: string;
};

type StructuredBookingValues = {
  serviceVariant?: string | null;
  repairIssue?: string | null;
  serviceComplaint?: string | null;
};

export type ResolvedBookingServiceDetails = {
  displayName: string;
  serviceVariant: string | null;
  repairIssue: string | null;
  serviceComplaint: string | null;
};

function cleanOptionalValue(value: string | null | undefined) {
  const sanitized = sanitizeFreeText(value);
  return sanitized || null;
}

export function getPublicServiceDisplayName(serviceType: BookingServiceType) {
  switch (serviceType.slug) {
    case SERVICE_TYPE_SLUGS.CLEANING:
      return "Cuci AC";
    case SERVICE_TYPE_SLUGS.REPAIR:
      return "Perbaikan";
    case SERVICE_TYPE_SLUGS.INSTALLATION:
      return "Pasang AC";
    case SERVICE_TYPE_SLUGS.GAS_REFILL:
      return "Isi Freon";
    case SERVICE_TYPE_SLUGS.RELOCATION:
      return "Relokasi (Bongkar Pasang)";
    case SERVICE_TYPE_SLUGS.OTHER:
      return "Lainnya";
    default:
      return serviceType.name;
  }
}

export function resolveStructuredBookingService(
  serviceType: BookingServiceType,
  values: StructuredBookingValues,
) {
  const serviceVariant = cleanOptionalValue(values.serviceVariant);
  const repairIssue = cleanOptionalValue(values.repairIssue);
  const serviceComplaint = cleanOptionalValue(values.serviceComplaint);
  const fieldErrors: Record<string, string[]> = {};

  if (serviceType.slug === SERVICE_TYPE_SLUGS.CLEANING) {
    if (!serviceVariant || !CLEANING_VARIANTS.includes(serviceVariant as (typeof CLEANING_VARIANTS)[number])) {
      fieldErrors.serviceVariant = ["Pilih tipe AC untuk layanan Cuci AC."];
    }
  }

  if (serviceType.slug === SERVICE_TYPE_SLUGS.REPAIR) {
    if (!repairIssue || !REPAIR_ISSUES.includes(repairIssue as (typeof REPAIR_ISSUES)[number])) {
      fieldErrors.repairIssue = ["Pilih jenis kendala untuk layanan Perbaikan."];
    }

    if (repairIssue === "Lainnya" && !serviceComplaint) {
      fieldErrors.serviceComplaint = ["Jelaskan keluhan untuk opsi Lainnya."];
    }
  }

  if (serviceType.slug === SERVICE_TYPE_SLUGS.OTHER && !serviceComplaint) {
    fieldErrors.serviceComplaint = ["Jelaskan kebutuhan servis Anda."];
  }

  return {
    fieldErrors,
    details: {
      displayName: getPublicServiceDisplayName(serviceType),
      serviceVariant: serviceType.slug === SERVICE_TYPE_SLUGS.CLEANING ? serviceVariant : null,
      repairIssue: serviceType.slug === SERVICE_TYPE_SLUGS.REPAIR ? repairIssue : null,
      serviceComplaint:
        serviceType.slug === SERVICE_TYPE_SLUGS.REPAIR || serviceType.slug === SERVICE_TYPE_SLUGS.OTHER
          ? serviceComplaint
          : null,
    } satisfies ResolvedBookingServiceDetails,
  };
}
