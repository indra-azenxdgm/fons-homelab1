import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminApiErrorState } from "@/features/admin/components/admin-api-error-state";
import { AdminSquadDetailView } from "@/features/admin/components/admin-squad-detail-view";
import { getAdminSquadDetail } from "@/features/admin/lib/server/admin-service";
import { getAdminDataErrorMessage } from "@/features/admin/lib/server/admin-error-message";
import { requireAdminPagePermission } from "@/features/admin/lib/page-auth";

type AdminSquadDetailPageProps = {
  params: Promise<{
    squadId: string;
  }>;
};

export default async function AdminSquadDetailPage({
  params,
}: AdminSquadDetailPageProps) {
  await requireAdminPagePermission("squads.read");
  const { squadId } = await params;
  let loadError: string | null = null;
  let squad: Awaited<ReturnType<typeof getAdminSquadDetail>> | null = null;

  try {
    squad = await getAdminSquadDetail(squadId);
  } catch (error) {
    loadError = getAdminDataErrorMessage(error, "Squad details could not be loaded right now.");
  }

  if (loadError) {
    return (
      <AdminApiErrorState
        title="Squad detail unavailable"
        message={loadError}
      />
    );
  }

  if (!squad) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <div className="panel p-5">
        <Link
          href="/admin/squads"
          className="text-[12px] leading-5 text-muted-foreground hover:text-foreground"
        >
          Back to squads
        </Link>
        <h1 className="admin-page-title mt-2 !text-[1.45rem] sm:!text-[1.6rem]">{squad.name}</h1>
        <p className="admin-page-copy mt-1">
          Compact squad profile and assignment workload details.
        </p>
      </div>

      <AdminSquadDetailView squad={squad} />
    </section>
  );
}
