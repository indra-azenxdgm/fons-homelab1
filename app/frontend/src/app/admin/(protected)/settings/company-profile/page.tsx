import { AdminApiErrorState } from "@/features/admin/components/admin-api-error-state";
import { AdminCompanyProfileSettings } from "@/features/admin/components/admin-company-profile-settings";
import { requireAdminPagePermission } from "@/features/admin/lib/page-auth";
import { getAdminDataErrorMessage } from "@/features/admin/lib/server/admin-error-message";
import { getAdminCompanyProfile } from "@/features/admin/lib/server/admin-service";

export default async function AdminCompanyProfilePage() {
  await requireAdminPagePermission("settings.manage");
  let profile = null as Awaited<ReturnType<typeof getAdminCompanyProfile>>["profile"] | null;
  let loadError: string | null = null;

  try {
    const result = await getAdminCompanyProfile();
    profile = result.profile;
  } catch (error) {
    loadError = getAdminDataErrorMessage(error, "Company profile could not be loaded right now.");
  }

  if (!profile || loadError) {
    return (
      <AdminApiErrorState
        title="Company profile unavailable"
        message={loadError || "Company profile could not be loaded right now."}
      />
    );
  }

  return <AdminCompanyProfileSettings initialProfile={profile} />;
}
