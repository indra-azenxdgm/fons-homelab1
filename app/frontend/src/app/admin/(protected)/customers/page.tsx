import { AdminApiErrorState } from "@/features/admin/components/admin-api-error-state";
import { AdminCustomerDetailDrawer } from "@/features/admin/components/admin-customer-detail-drawer";
import { AdminCustomersFilters } from "@/features/admin/components/admin-customers-filters";
import { AdminCustomersList } from "@/features/admin/components/admin-customers-list";
import { adminHasPermission } from "@/features/admin/lib/auth";
import {
  getAdminCustomerDetail,
  getAdminCustomers,
} from "@/features/admin/lib/server/admin-service";
import { getAdminDataErrorMessage } from "@/features/admin/lib/server/admin-error-message";
import { requireAdminPagePermission } from "@/features/admin/lib/page-auth";

type AdminCustomersPageProps = {
  searchParams: Promise<{
    q?: string;
    activity?: string;
    page?: string;
    customer?: string;
  }>;
};

export default async function AdminCustomersPage({
  searchParams,
}: AdminCustomersPageProps) {
  const adminUser = await requireAdminPagePermission("customers.read");

  const filters = await searchParams;
  let loadError: string | null = null;
  let customers: Awaited<ReturnType<typeof getAdminCustomers>> | null = null;
  let detailLoadError: string | null = null;
  let selectedCustomer: Awaited<ReturnType<typeof getAdminCustomerDetail>> | null = null;

  try {
    customers = await getAdminCustomers(filters);
  } catch (error) {
    loadError = getAdminDataErrorMessage(error, "Customer records could not be loaded right now.");
  }

  if (filters.customer) {
    try {
      selectedCustomer = await getAdminCustomerDetail(filters.customer);
    } catch (error) {
      detailLoadError = getAdminDataErrorMessage(error, "Customer details could not be loaded right now.");
    }
  }

  if (loadError || !customers) {
    return <AdminApiErrorState title="Customers unavailable" message={loadError || "Customer records could not be loaded right now."} />;
  }

  return (
    <section className="space-y-4">
      <AdminCustomersFilters query={filters.q} activity={filters.activity} />
      <AdminCustomersList
        customers={customers.items}
        page={customers.page}
        totalPages={customers.totalPages}
        q={filters.q}
        activity={filters.activity}
      />
      <AdminCustomerDetailDrawer
        customerId={filters.customer}
        customer={selectedCustomer}
        loadError={detailLoadError}
        canReadBookings={adminHasPermission(adminUser, "bookings.read")}
      />
    </section>
  );
}
