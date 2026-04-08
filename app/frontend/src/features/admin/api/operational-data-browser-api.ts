"use client";

import { BackendApiError, fetchBackendJson } from "@/lib/api-client";
import type { AdminOperationalDataWipeResponse } from "@/features/admin/lib/shared/admin-operational-data-types";

type OperationalDataWipeRequest = {
  confirmationText: string;
  dryRun: boolean;
  includeSubmissionLogs?: boolean;
};

function getFrontendOrigin() {
  return window.location.origin;
}

export async function postAdminOperationalDataWipeBrowser(
  input: OperationalDataWipeRequest,
) {
  return fetchBackendJson<AdminOperationalDataWipeResponse>("/api/admin/settings/operational-data/wipe", {
    baseUrl: getFrontendOrigin(),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export { BackendApiError };
