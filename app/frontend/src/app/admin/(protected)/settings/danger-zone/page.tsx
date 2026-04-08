import { redirect } from "next/navigation";

import { postAdminOperationalDataWipeApi } from "@/features/admin/api/operational-data-api";
import { AdminApiErrorState } from "@/features/admin/components/admin-api-error-state";
import { AdminOperationalDataDangerZone } from "@/features/admin/components/admin-operational-data-danger-zone";
import { requireAdminPagePermission } from "@/features/admin/lib/page-auth";
import { getAdminDataErrorMessage } from "@/features/admin/lib/server/admin-error-message";

export default async function AdminDangerZonePage() {
  const adminUser = await requireAdminPagePermission("settings.manage");

  if (adminUser.role !== "SUPER_ADMIN") {
    redirect("/admin/forbidden");
  }

  let preview = null as Awaited<ReturnType<typeof postAdminOperationalDataWipeApi>> | null;
  let loadError: string | null = null;

  try {
    preview = await postAdminOperationalDataWipeApi({
      confirmationText: "",
      dryRun: true,
      includeSubmissionLogs: false,
    });
  } catch (error) {
    loadError = getAdminDataErrorMessage(error, "Operational data preview could not be loaded right now.");
  }

  if (!preview || loadError) {
    return (
      <AdminApiErrorState
        title="Danger Zone unavailable"
        message={loadError || "Operational data preview could not be loaded right now."}
      />
    );
  }

  return <AdminOperationalDataDangerZone initialPreview={preview} />;
}
