"use client";

import type { AdminCompanyProfileInput } from "@/features/admin/lib/shared/admin-company-profile-types";
import type { AdminCompanyProfile } from "@/features/admin/lib/shared/admin-company-profile-types";
import { BackendApiError, fetchBackendJson } from "@/lib/api-client";

function getFrontendOrigin() {
  return window.location.origin;
}

export async function updateAdminCompanyProfileBrowser(input: AdminCompanyProfileInput) {
  return fetchBackendJson<{ success: true; profile: AdminCompanyProfile }>("/api/admin/settings/company-profile", {
    baseUrl: getFrontendOrigin(),
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function uploadAdminCompanyLogoBrowser(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return fetchBackendJson<{ success: true; logoUrl: string }>("/api/admin/settings/company-profile/logo", {
    baseUrl: getFrontendOrigin(),
    method: "POST",
    body: formData,
  });
}

export { BackendApiError };
