import { AdminApiErrorState } from "@/features/admin/components/admin-api-error-state";
import { AdminExpenseFilters } from "@/features/admin/components/admin-expense-filters";
import { AdminExpensesList } from "@/features/admin/components/admin-expenses-list";
import { adminHasPermission } from "@/features/admin/lib/auth";
import { requireAdminPagePermission } from "@/features/admin/lib/page-auth";
import { getAdminDataErrorMessage } from "@/features/admin/lib/server/admin-error-message";
import { getAdminExpenses } from "@/features/admin/lib/server/admin-service";

type AdminExpensesPageProps = {
  searchParams: Promise<{
    q?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
};

export default async function AdminExpensesPage({ searchParams }: AdminExpensesPageProps) {
  const adminUser = await requireAdminPagePermission("finance.read");
  const canManageFinance = adminHasPermission(adminUser, "finance.manage");
  const filters = await searchParams;
  let loadError: string | null = null;
  let expenses = null as Awaited<ReturnType<typeof getAdminExpenses>> | null;

  try {
    expenses = await getAdminExpenses(filters);
  } catch (error) {
    loadError = getAdminDataErrorMessage(error, "Expense records could not be loaded right now.");
  }

  if (loadError || !expenses) {
    return <AdminApiErrorState title="Expenses unavailable" message={loadError || "Expense records could not be loaded right now."} />;
  }

  return (
    <section className="space-y-4">
      <AdminExpenseFilters query={filters.q} from={filters.from} to={filters.to} canManageFinance={canManageFinance} />
      <AdminExpensesList items={expenses.items} page={expenses.page} totalPages={expenses.totalPages} q={filters.q} from={filters.from} to={filters.to} canManageFinance={canManageFinance} />
    </section>
  );
}
