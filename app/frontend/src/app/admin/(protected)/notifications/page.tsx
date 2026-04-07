import {
  getAdminNotificationOverviewApi,
  getAdminNotificationsApi,
} from "@/features/admin/api/notifications-api";
import { AdminNotificationOverviewPanel } from "@/features/admin/components/admin-notification-overview-panel";
import { AdminNotificationsFeed } from "@/features/admin/components/admin-notifications-feed";
import { requireAdminPagePermission } from "@/features/admin/lib/page-auth";

export default async function AdminNotificationsPage() {
  await requireAdminPagePermission("bookings.read");
  const [notifications, overview] = await Promise.all([
    getAdminNotificationsApi({ page: 1, limit: 50, view: "active" }),
    getAdminNotificationOverviewApi(),
  ]);

  return (
    <section className="min-w-0 w-full max-w-full space-y-3 sm:space-y-4">
      <AdminNotificationOverviewPanel overview={overview} />
      <AdminNotificationsFeed initialNotifications={notifications} />
    </section>
  );
}
