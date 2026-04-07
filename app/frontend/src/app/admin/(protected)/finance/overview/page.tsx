import { AdminApiErrorState } from "@/features/admin/components/admin-api-error-state";
import { AdminFinanceOverviewDashboard } from "@/features/admin/components/admin-finance-overview-dashboard";
import { requireAdminPagePermission } from "@/features/admin/lib/page-auth";
import { getAdminDataErrorMessage } from "@/features/admin/lib/server/admin-error-message";
import { getAdminFinanceOverview } from "@/features/admin/lib/server/admin-service";
import type { FinanceOverviewPeriod } from "@/features/admin/lib/shared/admin-finance-overview-types";

type AdminFinanceOverviewPageProps = {
  searchParams: Promise<{
    period?: string;
  }>;
};

function getFinanceOverviewPeriod(value: string | undefined): FinanceOverviewPeriod {
  if (value === "7D" || value === "30D" || value === "3M" || value === "12M") {
    return value;
  }

  return "12M";
}

export default async function AdminFinanceOverviewPage({ searchParams }: AdminFinanceOverviewPageProps) {
  await requireAdminPagePermission("finance.read");
  const filters = await searchParams;
  const period = getFinanceOverviewPeriod(filters.period);
  let overview = null as Awaited<ReturnType<typeof getAdminFinanceOverview>> | null;
  let loadError: string | null = null;

  try {
    overview = await getAdminFinanceOverview(period);
  } catch (error) {
    loadError = getAdminDataErrorMessage(error, "Finance overview could not be loaded right now.");
  }

  if (!overview || loadError) {
    return (
      <AdminApiErrorState
        title="Finance overview unavailable"
        message={loadError || "Finance overview could not be loaded right now."}
      />
    );
  }

  return <AdminFinanceOverviewDashboard overview={overview} activePeriod={period} />;
}
