"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

import { AdminLogoutButton } from "@/features/admin/components/admin-logout-button";
import { AdminNotificationBell } from "@/features/admin/components/admin-notification-bell";
import { AdminSidebarPopout } from "@/features/admin/components/admin-sidebar-popout";
import type {
  AdminNotificationPreferences,
  AdminNotificationType,
  AdminShellUser,
} from "@/features/admin/lib/contracts";
import type { AdminNotificationListResponse } from "@/features/admin/lib/shared/admin-notification-types";
import { cn } from "@/lib/utils";

type AdminSidebarUtilitiesProps = {
  adminUser: AdminShellUser;
  initialNotifications: AdminNotificationListResponse;
  initialPreferences: AdminNotificationPreferences;
  availableNotificationTypes: AdminNotificationType[];
  compact?: boolean;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return (parts[0]?.[0] ?? "A") + (parts[1]?.[0] ?? "");
}

export function AdminSidebarUtilities({
  adminUser,
  initialNotifications,
  initialPreferences,
  availableNotificationTypes,
  compact = false,
}: AdminSidebarUtilitiesProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  if (compact) {
    return (
      <>
        <div className="space-y-1">
          <div className="flex justify-center">
            <AdminNotificationBell
              initialNotifications={initialNotifications}
              initialPreferences={initialPreferences}
              availableNotificationTypes={availableNotificationTypes}
              triggerClassName="size-8.5 rounded-[0.8rem] border-transparent bg-transparent text-muted-foreground hover:border-border/70 hover:bg-white hover:text-foreground"
              iconClassName="size-[15px]"
            />
          </div>

          <div className="flex justify-center">
            <button
              ref={triggerRef}
              type="button"
              className="group flex size-8.5 items-center justify-center rounded-[0.8rem] border border-transparent bg-transparent text-muted-foreground transition hover:border-border/70 hover:bg-white hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-controls="admin-profile-menu"
              aria-label="Profile menu"
            >
              <span className="flex size-6.5 items-center justify-center rounded-[0.7rem] border border-sidebar-border/80 bg-white/92 text-[10px] font-semibold text-primary transition group-hover:border-[color:var(--border-strong)]">
                {getInitials(adminUser.name)}
              </span>
            </button>
          </div>
        </div>

        <AdminSidebarPopout
          open={isMenuOpen}
          triggerRef={triggerRef}
          onClose={() => setIsMenuOpen(false)}
          className="w-52 p-1.5"
        >
          <div id="admin-profile-menu" role="menu" aria-label="Profile menu">
            <div className="space-y-1">
              <Link
                href="/admin/settings/company-profile"
                className="flex h-8 items-center rounded-[0.75rem] px-2.5 text-[11px] font-medium text-foreground transition hover:bg-muted/55"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
              <AdminLogoutButton
                className="h-8 w-full justify-start rounded-[0.75rem] border-0 bg-transparent px-2.5 text-[11px] shadow-none hover:bg-muted/55"
                label="Sign out"
              />
            </div>
          </div>
        </AdminSidebarPopout>
      </>
    );
  }

  return (
    <>
      <div className="space-y-0.5">
        <AdminNotificationBell
          initialNotifications={initialNotifications}
          initialPreferences={initialPreferences}
          availableNotificationTypes={availableNotificationTypes}
          mode="sidebar-row"
          subtitle={undefined}
        />

        <button
          ref={triggerRef}
          type="button"
          className="group flex w-full items-center gap-2 rounded-[0.8rem] border border-transparent px-2 py-1.5 text-left text-[11px] leading-4 font-medium text-sidebar-foreground/74 transition hover:border-border/70 hover:bg-white/92 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          onClick={() => setIsMenuOpen((value) => !value)}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          aria-controls="admin-profile-menu"
        >
          <span className="flex size-6.5 items-center justify-center rounded-[0.7rem] border border-sidebar-border/80 bg-white/92 text-[10px] font-semibold text-primary transition group-hover:border-[color:var(--border-strong)]">
            {getInitials(adminUser.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] leading-4">
              {adminUser.name}
            </span>
            <span className="block truncate text-[10px] leading-4 text-muted-foreground">
              {adminUser.role.replaceAll("_", " ").toLowerCase()}
            </span>
          </span>
          <ChevronRight className={cn("size-3.5 text-muted-foreground transition", isMenuOpen && "translate-x-0.5")} />
        </button>
      </div>

      <AdminSidebarPopout
        open={isMenuOpen}
        triggerRef={triggerRef}
        onClose={() => setIsMenuOpen(false)}
        className="w-52 p-1.5"
      >
        <div id="admin-profile-menu" role="menu" aria-label="Profile menu">
          <div className="space-y-1">
            <Link
              href="/admin/settings/company-profile"
              className="flex h-8 items-center rounded-[0.75rem] px-2.5 text-[11px] font-medium text-foreground transition hover:bg-muted/55"
              onClick={() => setIsMenuOpen(false)}
            >
              Profile
            </Link>
            <AdminLogoutButton
              className="h-8 w-full justify-start rounded-[0.75rem] border-0 bg-transparent px-2.5 text-[11px] shadow-none hover:bg-muted/55"
              label="Sign out"
            />
          </div>
        </div>
      </AdminSidebarPopout>
    </>
  );
}
