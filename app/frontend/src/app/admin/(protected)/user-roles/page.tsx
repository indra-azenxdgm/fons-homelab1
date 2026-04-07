import { AdminApiErrorState } from "@/features/admin/components/admin-api-error-state";
import { AdminUserRolesFilters } from "@/features/admin/components/admin-user-roles-filters";
import { AdminUserRolesList } from "@/features/admin/components/admin-user-roles-list";
import { requireAdminPagePermission } from "@/features/admin/lib/page-auth";
import { getAdminDataErrorMessage } from "@/features/admin/lib/server/admin-error-message";
import { getAdminUsers } from "@/features/admin/lib/server/admin-service";

type AdminUserRolesPageProps = {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
};

export default async function AdminUserRolesPage({
  searchParams,
}: AdminUserRolesPageProps) {
  const adminUser = await requireAdminPagePermission("users.manage");
  const filters = await searchParams;
  let loadError: string | null = null;
  let users: Awaited<ReturnType<typeof getAdminUsers>> | null = null;

  try {
    users = await getAdminUsers(filters);
  } catch (error) {
    loadError = getAdminDataErrorMessage(error, "User and role records could not be loaded right now.");
  }

  if (loadError || !users) {
    return <AdminApiErrorState title="Users unavailable" message={loadError || "User and role records could not be loaded right now."} />;
  }

  return (
    <section className="space-y-4">
      <AdminUserRolesFilters query={filters.q} role={filters.role} status={filters.status} />
      <AdminUserRolesList
        users={users.items}
        currentAdminUserId={adminUser.id}
        currentAdminUserRole={adminUser.role}
        totalCount={users.totalCount}
        page={users.page}
        totalPages={users.totalPages}
        q={filters.q}
        role={filters.role}
        status={filters.status}
      />
    </section>
  );
}
