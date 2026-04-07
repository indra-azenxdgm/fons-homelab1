import {
  Droplets,
  House,
  MessageSquareMore,
  Snowflake,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

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

export type PublicServiceType = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  estimatedDuration: number | null;
};

type ServiceVisual = {
  icon: LucideIcon;
  shortLabel: string;
  displayName: string;
  description?: string;
};

const SERVICE_ORDER: Record<string, number> = {
  [SERVICE_TYPE_SLUGS.CLEANING]: 0,
  [SERVICE_TYPE_SLUGS.REPAIR]: 1,
  [SERVICE_TYPE_SLUGS.INSTALLATION]: 2,
  [SERVICE_TYPE_SLUGS.RELOCATION]: 3,
  [SERVICE_TYPE_SLUGS.OTHER]: 4,
  [SERVICE_TYPE_SLUGS.GAS_REFILL]: 5,
};

export function sortPublicServiceTypes(serviceTypes: PublicServiceType[]) {
  return [...serviceTypes].sort((left, right) => {
    const leftOrder = SERVICE_ORDER[left.slug] ?? 99;
    const rightOrder = SERVICE_ORDER[right.slug] ?? 99;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.name.localeCompare(right.name, "id-ID");
  });
}

export function getPublicServiceVisual(serviceType: Pick<PublicServiceType, "name" | "slug">): ServiceVisual {
  switch (serviceType.slug) {
    case SERVICE_TYPE_SLUGS.CLEANING:
      return {
        icon: Droplets,
        shortLabel: "Cuci AC",
        displayName: "Cuci AC",
      };
    case SERVICE_TYPE_SLUGS.REPAIR:
      return {
        icon: Wrench,
        shortLabel: "Perbaikan",
        displayName: "Perbaikan",
      };
    case SERVICE_TYPE_SLUGS.INSTALLATION:
      return {
        icon: House,
        shortLabel: "Pasang AC",
        displayName: "Pasang AC",
      };
    case SERVICE_TYPE_SLUGS.GAS_REFILL:
      return {
        icon: Snowflake,
        shortLabel: "Isi Freon",
        displayName: "Isi Freon",
      };
    case SERVICE_TYPE_SLUGS.RELOCATION:
      return {
        icon: Sparkles,
        shortLabel: "Relokasi",
        displayName: "Relokasi (Bongkar Pasang)",
        description: "Bongkar lalu pasang kembali AC untuk pindah titik atau relokasi unit.",
      };
    case SERVICE_TYPE_SLUGS.OTHER:
      return {
        icon: MessageSquareMore,
        shortLabel: "Lainnya",
        displayName: "Lainnya",
        description: "Tulis kebutuhan servis lain yang belum tercakup di pilihan utama.",
      };
    default:
      return {
        icon: Wrench,
        shortLabel: serviceType.name,
        displayName: serviceType.name,
      };
  }
}

export function getPublicServiceDescription(serviceType: PublicServiceType) {
  return getPublicServiceVisual(serviceType).description || serviceType.description;
}

export function buildPublicBookingServiceSummary(input: {
  serviceName: string;
  serviceVariant?: string | null;
  repairIssue?: string | null;
  serviceComplaint?: string | null;
}) {
  const parts = [input.serviceName];

  if (input.serviceVariant) {
    parts.push(input.serviceVariant);
  }

  if (input.repairIssue) {
    parts.push(input.repairIssue);
  }

  return parts.join(" | ");
}
