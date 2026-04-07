import { AdminApiErrorState } from "@/features/admin/components/admin-api-error-state";
import { AdminIncomeFilters } from "@/features/admin/components/admin-income-filters";
import { AdminIncomeList } from "@/features/admin/components/admin-income-list";
import { adminHasPermission } from "@/features/admin/lib/auth";
import { requireAdminPagePermission } from "@/features/admin/lib/page-auth";
import { getAdminDataErrorMessage } from "@/features/admin/lib/server/admin-error-message";
import { getAdminFinanceBookingLookup, getAdminIncome } from "@/features/admin/lib/server/admin-service";

type AdminIncomePageProps = {
  searchParams: Promise<{
    q?: string;
    from?: string;
    to?: string;
    paymentMethod?: string;
    bookingLink?: string;
    page?: string;
  }>;
};

export default async function AdminIncomePage({ searchParams }: AdminIncomePageProps) {
  const adminUser = await requireAdminPagePermission("finance.read");
  const canManageFinance = adminHasPermission(adminUser, "finance.manage");
  const filters = await searchParams;
  let loadError: string | null = null;
  let income = null as Awaited<ReturnType<typeof getAdminIncome>> | null;
  let bookingLookup = { items: [] } as Awaited<ReturnType<typeof getAdminFinanceBookingLookup>>;

  const [incomeResult, bookingLookupResult] = await Promise.allSettled([
    getAdminIncome(filters),
    getAdminFinanceBookingLookup({ limit: "50" }),
  ]);

  if (incomeResult.status === "fulfilled") {
    income = incomeResult.value;
  } else {
    loadError = getAdminDataErrorMessage(incomeResult.reason, "Income records could not be loaded right now.");
  }

  if (bookingLookupResult.status === "fulfilled") {
    bookingLookup = bookingLookupResult.value;
  }

  if (loadError || !income) {
    return <AdminApiErrorState title="Income unavailable" message={loadError || "Income records could not be loaded right now."} />;
  }

  return (
    <section className="space-y-4">
      <AdminIncomeFilters
        query={filters.q}
        from={filters.from}
        to={filters.to}
        paymentMethod={filters.paymentMethod}
        bookingLink={filters.bookingLink}
        bookingOptions={bookingLookup.items}
        canManageFinance={canManageFinance}
      />
      <AdminIncomeList
        items={income.items}
        page={income.page}
        totalPages={income.totalPages}
        q={filters.q}
        from={filters.from}
        to={filters.to}
        paymentMethod={filters.paymentMethod}
        bookingLink={filters.bookingLink}
        bookingOptions={bookingLookup.items}
        canManageFinance={canManageFinance}
      />
    </section>
  );
}
