import { AdminDashboardOverview } from "@/features/admin/components/admin-dashboard-overview";
import { getAdminDashboardOverview } from "@/features/admin/lib/server/admin-service";
import { requireAdminPagePermission } from "@/features/admin/lib/page-auth";

export default async function AdminDashboardPage() {
  await requireAdminPagePermission("dashboard.read");
  const overview = await getAdminDashboardOverview();

  return <AdminDashboardOverview overview={overview} />;
}
