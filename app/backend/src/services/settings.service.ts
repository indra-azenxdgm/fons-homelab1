import { db } from "@/lib/prisma";

const companyProfileSingletonKey = "default";

export type CompanyProfileInput = {
  companyName: string;
  companyTagline?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logoUrl?: string | null;
};

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeWebsite(value: string | null | undefined) {
  const normalized = normalizeOptionalText(value);

  if (!normalized) {
    return null;
  }

  return /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
}

function mapCompanyProfile(
  profile: {
    id: string;
    companyName: string;
    companyTagline: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    logoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null,
) {
  return {
    id: profile?.id ?? null,
    companyName: profile?.companyName ?? "",
    companyTagline: profile?.companyTagline ?? null,
    address: profile?.address ?? null,
    phone: profile?.phone ?? null,
    email: profile?.email ?? null,
    website: profile?.website ?? null,
    logoUrl: profile?.logoUrl ?? null,
    createdAt: profile?.createdAt ?? null,
    updatedAt: profile?.updatedAt ?? null,
    hasProfile: Boolean(profile),
  };
}

export async function getCompanyProfile() {
  const profile = await db.companyProfile.findUnique({
    where: {
      singletonKey: companyProfileSingletonKey,
    },
  });

  return mapCompanyProfile(profile);
}

export async function upsertCompanyProfile(input: CompanyProfileInput) {
  const profile = await db.companyProfile.upsert({
    where: {
      singletonKey: companyProfileSingletonKey,
    },
    create: {
      singletonKey: companyProfileSingletonKey,
      companyName: input.companyName.trim(),
      companyTagline: normalizeOptionalText(input.companyTagline),
      address: normalizeOptionalText(input.address),
      phone: normalizeOptionalText(input.phone),
      email: normalizeOptionalText(input.email),
      website: normalizeWebsite(input.website),
      logoUrl: normalizeOptionalText(input.logoUrl),
    },
    update: {
      companyName: input.companyName.trim(),
      companyTagline: normalizeOptionalText(input.companyTagline),
      address: normalizeOptionalText(input.address),
      phone: normalizeOptionalText(input.phone),
      email: normalizeOptionalText(input.email),
      website: normalizeWebsite(input.website),
      logoUrl: normalizeOptionalText(input.logoUrl),
    },
  });

  return mapCompanyProfile(profile);
}

export async function getCompanyProfileForExport() {
  return getCompanyProfile();
}
