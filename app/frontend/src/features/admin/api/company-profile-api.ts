import "server-only";

import { fetchAdminApi } from "@/features/admin/api/admin-api";
import type {
  AdminCompanyProfile,
} from "@/features/admin/lib/shared/admin-company-profile-types";

export async function getAdminCompanyProfileApi() {
  return fetchAdminApi<{
    profile: AdminCompanyProfile;
  }>("/api/admin/settings/company-profile");
}
