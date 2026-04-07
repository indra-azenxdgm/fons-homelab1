"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAdminBrowser } from "@/features/admin/api/admin-browser-api";
import { cn } from "@/lib/utils";

type AdminLogoutButtonProps = {
  className?: string;
  label?: string;
};

export function AdminLogoutButton({
  className,
  label = "Sign out",
}: AdminLogoutButtonProps) {
  async function onLogout() {
    await logoutAdminBrowser();
    window.location.replace("/admin/login");
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "admin-button-text h-8 rounded-full border-border bg-white px-3 shadow-none hover:border-[color:var(--border-strong)] hover:bg-secondary",
        className,
      )}
      onClick={onLogout}
    >
      <LogOut className="size-4" />
      {label}
    </Button>
  );
}
