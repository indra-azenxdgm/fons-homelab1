import "server-only";

import { fetchAdminApi } from "@/features/admin/api/admin-api";
import type { AdminOperationalDataWipeResponse } from "@/features/admin/lib/shared/admin-operational-data-types";

type OperationalDataWipeRequest = {
  confirmationText: string;
  dryRun: boolean;
  includeSubmissionLogs?: boolean;
};

export async function postAdminOperationalDataWipeApi(
  input: OperationalDataWipeRequest,
) {
  return fetchAdminApi<AdminOperationalDataWipeResponse>("/api/admin/settings/operational-data/wipe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}
