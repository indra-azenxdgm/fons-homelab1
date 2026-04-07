"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AdminApiErrorState } from "@/features/admin/components/admin-api-error-state";
import { AdminDrawer } from "@/features/admin/components/admin-drawer";
import { AdminSquadDetailView } from "@/features/admin/components/admin-squad-detail-view";
import type { AdminSquadDetail } from "@/features/admin/lib/shared/admin-squad-types";

type AdminSquadDetailDrawerProps = {
  squadId?: string;
  squad: AdminSquadDetail | null;
  loadError?: string | null;
};

export function AdminSquadDetailDrawer({
  squadId,
  squad,
  loadError,
}: AdminSquadDetailDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isOpen = Boolean(squadId);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("squad");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <AdminDrawer
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={squad ? squad.name : "Squad details"}
      description={
        squad
          ? `${squad.alias} • ${squad.isActive ? "Active" : "Inactive"}`
          : "Review squad profile details and assignment workload."
      }
      className="max-w-full sm:max-w-[42rem] xl:max-w-[48rem]"
    >
      {loadError ? (
        <AdminApiErrorState title="Squad detail unavailable" message={loadError} />
      ) : squad ? (
        <AdminSquadDetailView squad={squad} layout="drawer" />
      ) : (
        <AdminApiErrorState
          title="Squad not found"
          message="The selected squad could not be found."
        />
      )}
    </AdminDrawer>
  );
}
