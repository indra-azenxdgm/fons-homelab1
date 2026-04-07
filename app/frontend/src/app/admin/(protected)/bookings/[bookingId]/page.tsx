import { redirect } from "next/navigation";
import { requireAdminPagePermission } from "@/features/admin/lib/page-auth";

type AdminBookingDetailPageProps = {
  params: Promise<{
    bookingId: string;
  }>;
};

export default async function AdminBookingDetailPage({
  params,
}: AdminBookingDetailPageProps) {
  await requireAdminPagePermission("bookings.read");
  const { bookingId } = await params;
  redirect(`/admin/bookings?booking=${encodeURIComponent(bookingId)}`);
}
