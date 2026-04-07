import { getAdminNotificationRulesApi } from "@/features/admin/api/notifications-api";
import { AdminNotificationPreferencesPanel } from "@/features/admin/components/admin-notification-preferences-panel";
import { AdminNotificationRulesPanel } from "@/features/admin/components/admin-notification-rules-panel";
import { requireAdminPagePermission } from "@/features/admin/lib/page-auth";

export default async function AdminNotificationSettingsPage() {
  const adminUser = await requireAdminPagePermission("settings.manage");
  const rulesResult = await getAdminNotificationRulesApi().catch(() => null);

  return (
    <section className="space-y-4">
      <AdminNotificationPreferencesPanel
        initialPreferences={adminUser.notificationPreferences}
        availableNotificationTypes={adminUser.availableNotificationTypes}
      />
      {rulesResult ? (
        <AdminNotificationRulesPanel initialRules={rulesResult.rules} />
      ) : null}
    </section>
  );
}
