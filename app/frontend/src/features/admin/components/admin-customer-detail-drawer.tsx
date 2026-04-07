"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AdminApiErrorState } from "@/features/admin/components/admin-api-error-state";
import { AdminDrawer } from "@/features/admin/components/admin-drawer";
import { AdminCustomerDetailView } from "@/features/admin/components/admin-customer-detail-view";
import type { AdminCustomerDetail } from "@/features/admin/lib/shared/admin-customer-types";

type AdminCustomerDetailDrawerProps = {
  customerId?: string;
  customer: AdminCustomerDetail | null;
  loadError?: string | null;
  canReadBookings: boolean;
};

export function AdminCustomerDetailDrawer({
  customerId,
  customer,
  loadError,
  canReadBookings,
}: AdminCustomerDetailDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isOpen = Boolean(customerId);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("customer");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <AdminDrawer
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={customer ? customer.fullName : "Customer details"}
      description={
        customer
          ? `${customer._count.bookings} booking${customer._count.bookings === 1 ? "" : "s"} recorded`
          : "Review customer profile details and recent booking history."
      }
      className="max-w-full sm:max-w-[42rem] xl:max-w-[48rem]"
    >
      {loadError ? (
        <AdminApiErrorState title="Customer detail unavailable" message={loadError} />
      ) : customer ? (
        <AdminCustomerDetailView customer={customer} canReadBookings={canReadBookings} layout="drawer" />
      ) : (
        <AdminApiErrorState
          title="Customer not found"
          message="The selected customer could not be found."
        />
      )}
    </AdminDrawer>
  );
}
