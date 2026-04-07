import { redirect } from "next/navigation";

import { getAdminNotificationsApi } from "@/features/admin/api/notifications-api";
import { AdminShellFrame } from "@/features/admin/components/admin-shell-frame";
import {
  adminHasPermission,
  getCurrentAdminUser,
} from "@/features/admin/lib/auth";
import { adminNavigationItems } from "@/features/admin/lib/navigation";
import type { AdminNavigationItem, AdminShellUser } from "@/features/admin/lib/contracts";

function filterNavigationItemsForUser(
  items: AdminNavigationItem[],
  adminUser: AdminShellUser,
) {
  return items.flatMap((item) => {
    if (!adminHasPermission(adminUser, item.permission)) {
      return [];
    }

    const children = item.children
      ? item.children.filter((child) => adminHasPermission(adminUser, child.permission))
      : undefined;

    return [{ ...item, children }];
  });
}

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    redirect("/admin/login");
  }

  if (adminUser.mustChangePassword) {
    redirect("/admin/change-password");
  }

  const navigationItems = filterNavigationItemsForUser(adminNavigationItems, adminUser);
  const initialNotifications = adminHasPermission(adminUser, "bookings.read")
    ? await getAdminNotificationsApi({ limit: 6, view: "active" }).catch(() => ({
        items: [],
        totalCount: 0,
        unreadCount: 0,
        page: 1,
        pageSize: 6,
        totalPages: 1,
      }))
    : {
        items: [],
        totalCount: 0,
        unreadCount: 0,
        page: 1,
        pageSize: 6,
        totalPages: 1,
      };

  return (
    <AdminShellFrame
      adminUser={adminUser}
      navigationItems={navigationItems}
      initialNotifications={initialNotifications}
      initialPreferences={adminUser.notificationPreferences}
      availableNotificationTypes={adminUser.availableNotificationTypes}
    >
      {children}
    </AdminShellFrame>
  );
}
