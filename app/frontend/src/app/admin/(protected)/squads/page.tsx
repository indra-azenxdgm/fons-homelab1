import { AdminApiErrorState } from "@/features/admin/components/admin-api-error-state";
import { AdminSquadDetailDrawer } from "@/features/admin/components/admin-squad-detail-drawer";
import { AdminSquadsFilters } from "@/features/admin/components/admin-squads-filters";
import { AdminSquadsList } from "@/features/admin/components/admin-squads-list";
import { adminHasPermission } from "@/features/admin/lib/auth";
import {
  getAdminSquadDetail,
  getAdminSquadsList,
} from "@/features/admin/lib/server/admin-service";
import { getAdminDataErrorMessage } from "@/features/admin/lib/server/admin-error-message";
import { requireAdminPagePermission } from "@/features/admin/lib/page-auth";

type AdminSquadsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
    squad?: string;
  }>;
};

export default async function AdminSquadsPage({
  searchParams,
}: AdminSquadsPageProps) {
  const adminUser = await requireAdminPagePermission("squads.read");
  const canManageSquads = adminHasPermission(adminUser, "squads.manage");
  const filters = await searchParams;
  let loadError: string | null = null;
  let squads: Awaited<ReturnType<typeof getAdminSquadsList>> | null = null;
  let detailLoadError: string | null = null;
  let selectedSquad: Awaited<ReturnType<typeof getAdminSquadDetail>> | null = null;

  try {
    squads = await getAdminSquadsList(filters);
  } catch (error) {
    loadError = getAdminDataErrorMessage(error, "Squad records could not be loaded right now.");
  }

  if (filters.squad) {
    try {
      selectedSquad = await getAdminSquadDetail(filters.squad);
    } catch (error) {
      detailLoadError = getAdminDataErrorMessage(error, "Squad details could not be loaded right now.");
    }
  }

  if (loadError || !squads) {
    return <AdminApiErrorState title="Squads unavailable" message={loadError || "Squad records could not be loaded right now."} />;
  }

  return (
    <section className="space-y-4">
      <AdminSquadsFilters query={filters.q} status={filters.status} canManageSquads={canManageSquads} />

      <AdminSquadsList
        squads={squads.items}
        page={squads.page}
        totalPages={squads.totalPages}
        q={filters.q}
        status={filters.status}
      />
      <AdminSquadDetailDrawer
        squadId={filters.squad}
        squad={selectedSquad}
        loadError={detailLoadError}
      />
    </section>
  );
}
