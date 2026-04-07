"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AdminNavigation } from "@/features/admin/components/admin-navigation";
import { AdminSidebarUtilities } from "@/features/admin/components/admin-sidebar-utilities";
import type {
  AdminNotificationPreferences,
  AdminNotificationType,
  AdminNavigationItem,
  AdminShellUser,
} from "@/features/admin/lib/contracts";
import { getAdminPageContext } from "@/features/admin/lib/navigation";
import type { AdminNotificationListResponse } from "@/features/admin/lib/shared/admin-notification-types";

type AdminShellFrameProps = {
  adminUser: AdminShellUser;
  navigationItems: AdminNavigationItem[];
  initialNotifications: AdminNotificationListResponse;
  initialPreferences: AdminNotificationPreferences;
  availableNotificationTypes: AdminNotificationType[];
  children: React.ReactNode;
};

function AdminBrandBlock() {
  return (
    <Link
      href="/admin/dashboard"
      aria-label="Fon's Admin"
      className="px-4 py-4 transition hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 items-center">
          <Image
            src="/fons-header.png"
            alt="Fon's"
            width={102}
            height={30}
            priority
            className="h-6.5 w-auto object-contain"
          />
        </div>
        <div className="min-w-0">
          <p className="admin-card-title truncate">
            Fon&apos;s Admin
          </p>
          <p className="admin-meta-text truncate">
            CRM workspace
          </p>
        </div>
      </div>
    </Link>
  );
}

export function AdminShellFrame({
  adminUser,
  navigationItems,
  initialNotifications,
  initialPreferences,
  availableNotificationTypes,
  children,
}: AdminShellFrameProps) {
  const pathname = usePathname();
  const pageContext = getAdminPageContext(pathname);

  return (
    <main
      className="admin-shell"
      style={{
        "--admin-mobile-rail-width": "3.1rem",
        "--admin-mobile-rail-gap": "0.9rem",
      } as CSSProperties}
    >
      <div className="min-h-dvh">
        <aside className="fixed bottom-3 left-[var(--admin-shell-gutter)] top-3 hidden w-[214px] xl:block">
          <div className="flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-sidebar-border/80 bg-sidebar shadow-[0_18px_34px_-30px_rgba(0,81,162,0.12)]">
            <AdminBrandBlock />

            <div className="flex-1 px-2.5 py-2.5">
              <AdminNavigation items={navigationItems} />
            </div>

            <div className="mt-auto space-y-2 border-t border-sidebar-border/80 px-2.5 py-2.5">
              <AdminSidebarUtilities
                adminUser={adminUser}
                initialNotifications={initialNotifications}
                initialPreferences={initialPreferences}
                availableNotificationTypes={availableNotificationTypes}
              />

              <footer className="text-[10px] leading-5 text-muted-foreground">
                Developed by <span className="font-semibold text-foreground/88">Azenx Digital Mandiri</span>
              </footer>
            </div>
          </div>
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-col xl:pl-[231px]">
          <div className="relative flex min-w-0 flex-1 items-start overflow-x-hidden xl:block">
            <div className="fixed bottom-4 left-[var(--admin-shell-gutter)] top-4 z-30 w-[var(--admin-mobile-rail-width)] xl:hidden">
              <div className="flex h-full flex-col overflow-hidden rounded-[0.95rem] border border-border/70 bg-white px-1 py-1.5 shadow-[0_10px_22px_-20px_rgba(0,81,162,0.16)]">
                <AdminNavigation items={navigationItems} compact />

                <div className="mt-auto border-t border-border/70 pt-1.5">
                  <AdminSidebarUtilities
                    adminUser={adminUser}
                    initialNotifications={initialNotifications}
                    initialPreferences={initialPreferences}
                    availableNotificationTypes={availableNotificationTypes}
                    compact
                  />
                </div>
              </div>
            </div>

            <div className="min-w-0 max-w-full flex-1 overflow-x-hidden pb-3 pl-[calc(var(--admin-mobile-rail-width)+var(--admin-mobile-rail-gap))] pr-[var(--admin-shell-gutter)] pt-3 xl:pb-4 xl:pl-0 xl:pr-0 xl:pt-3">
              <div className="min-w-0 w-full max-w-full overflow-x-hidden px-0 py-0">
                <section className="mb-3 min-w-0 max-w-full overflow-hidden px-0.5 pt-1 sm:mb-3 sm:px-1">
                  <div className="space-y-1">
                    <h1 className="admin-page-title">
                      {pageContext.title}
                    </h1>
                    <p className="admin-page-copy max-w-3xl min-w-0">
                      {pageContext.description}
                    </p>
                  </div>
                </section>

                <div className="admin-content-scale min-w-0 w-full max-w-full overflow-x-hidden">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
