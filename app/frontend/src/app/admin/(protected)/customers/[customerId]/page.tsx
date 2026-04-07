import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminApiErrorState } from "@/features/admin/components/admin-api-error-state";
import { AdminCustomerDetailView } from "@/features/admin/components/admin-customer-detail-view";
import { adminHasPermission } from "@/features/admin/lib/auth";
import { getAdminDataErrorMessage } from "@/features/admin/lib/server/admin-error-message";
import { getAdminCustomerDetail } from "@/features/admin/lib/server/admin-service";
import { requireAdminPagePermission } from "@/features/admin/lib/page-auth";

type AdminCustomerDetailPageProps = {
  params: Promise<{
    customerId: string;
  }>;
};

export default async function AdminCustomerDetailPage({
  params,
}: AdminCustomerDetailPageProps) {
  const adminUser = await requireAdminPagePermission("customers.read");

  const { customerId } = await params;
  let loadError: string | null = null;
  let customer: Awaited<ReturnType<typeof getAdminCustomerDetail>> | null = null;

  try {
    customer = await getAdminCustomerDetail(customerId);
  } catch (error) {
    loadError = getAdminDataErrorMessage(error, "Customer details could not be loaded right now.");
  }

  if (loadError) {
    return (
      <AdminApiErrorState
        title="Customer detail unavailable"
        message={loadError}
      />
    );
  }

  if (!customer) {
    notFound();
  }
  const canReadBookings = adminHasPermission(adminUser, "bookings.read");

  return (
    <section className="space-y-4">
      <div className="panel p-5">
        <Link
          href="/admin/customers"
          className="text-[12px] leading-5 text-muted-foreground hover:text-foreground"
        >
          Back to customers
        </Link>
        <h1 className="admin-page-title mt-2 !text-[1.45rem] sm:!text-[1.6rem]">{customer.fullName}</h1>
        <p className="admin-page-copy mt-1">
          Compact customer profile and recent booking history.
        </p>
      </div>

      <AdminCustomerDetailView customer={customer} canReadBookings={canReadBookings} />
    </section>
  );
}
