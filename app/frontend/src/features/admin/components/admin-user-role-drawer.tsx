"use client";

import { useId, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  BackendApiError,
  resetAdminUserPasswordBrowser,
  updateAdminUserRoleBrowser,
} from "@/features/admin/api/admin-browser-api";
import { AdminDrawer } from "@/features/admin/components/admin-drawer";
import { AdminUserPasswordBadge } from "@/features/admin/components/admin-user-password-badge";
import { AdminUserRoleBadge } from "@/features/admin/components/admin-user-role-badge";
import { AdminUserStatusBadge } from "@/features/admin/components/admin-user-status-badge";
import { AdminUserTemporaryPasswordPanel } from "@/features/admin/components/admin-user-temporary-password-panel";
import type { AdminUserListItem } from "@/features/admin/lib/shared/admin-user-types";

const fieldClassName =
  "h-8 w-full rounded-[1rem] border border-border bg-background px-2.5 py-1.5 text-[11px] leading-4 outline-none transition focus:border-primary";

const fieldLabelClassName =
  "admin-kicker-label";

const roleOptions = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "SQUAD", label: "Squad" },
] as const;

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

const roleHelperCopy: Record<AdminUserListItem["role"], string> = {
  SUPER_ADMIN: "Full platform access, including user and role management.",
  ADMIN: "Operational access to bookings, calendar, customer, and squad workflows.",
  SQUAD: "Field-level operational access to overview and assigned booking workflows.",
};

type AdminUserRoleDrawerProps = {
  user: AdminUserListItem | null;
  currentAdminUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated?: (user: AdminUserListItem) => void;
};

export function AdminUserRoleDrawer({
  user,
  currentAdminUserId,
  open,
  onOpenChange,
  onUserUpdated,
}: AdminUserRoleDrawerProps) {
  const drawerDescriptionId = useId();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<AdminUserListItem["role"]>(user?.role || "ADMIN");
  const [selectedStatus, setSelectedStatus] = useState<typeof statusOptions[number]["value"]>(
    user?.isActive ? "active" : "inactive",
  );
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSelf = user?.id === currentAdminUserId;
  const isProtectedSuperAdmin = Boolean(user?.isLastActiveSuperAdmin);
  const isStatusChangeBlocked = isSelf || isProtectedSuperAdmin;
  const isRoleChangeBlocked = isSelf || isProtectedSuperAdmin;
  const hasChanges = Boolean(
    user
    && (selectedRole !== user.role || (selectedStatus === "active") !== user.isActive),
  );

  function handleSubmit() {
    if (!user || isSelf) {
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const result = await updateAdminUserRoleBrowser(user.id, {
          role: selectedRole,
          isActive: selectedStatus === "active",
        });
        onUserUpdated?.(result.user);
        onOpenChange(false);
        router.refresh();
      } catch (nextError) {
        setError(
          nextError instanceof BackendApiError
            ? getAdminUserAccessErrorMessage(nextError)
            : "Unable to update user access",
        );
      }
    });
  }

  function handlePasswordReset() {
    if (!user || isSelf) {
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const result = await resetAdminUserPasswordBrowser(user.id);
        setTemporaryPassword(result.temporaryPassword);
        onUserUpdated?.(result.user);
        router.refresh();
      } catch (nextError) {
        setError(
          nextError instanceof BackendApiError
            ? getAdminUserAccessErrorMessage(nextError)
            : "Unable to reset password",
        );
      }
    });
  }

  return (
    <AdminDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Edit user role"
      description="Update role and account status for this user. Changes apply on the next protected request."
    >
      {user ? (
        <div className="space-y-3" aria-describedby={drawerDescriptionId}>
          <div id={drawerDescriptionId} className="rounded-[1rem] border border-border/70 bg-muted/30 px-4 py-2">
            <p className="admin-card-title">{user.name}</p>
            <p className="admin-meta-text mt-1">{user.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <AdminUserRoleBadge role={user.role} />
              <AdminUserStatusBadge isActive={user.isActive} />
              <AdminUserPasswordBadge mustChangePassword={user.mustChangePassword} />
            </div>
          </div>

          <div className="rounded-[1rem] border border-border/70 bg-white px-4 py-2">
            <p className="admin-kicker-label">
              Current role
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <AdminUserRoleBadge role={user.role} />
              <p className="admin-meta-text">{roleHelperCopy[user.role]}</p>
            </div>
          </div>

          <label className="grid gap-1.5">
            <span className={fieldLabelClassName}>Assigned role</span>
            <select
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as AdminUserListItem["role"])}
              className={fieldClassName}
              disabled={isPending || isRoleChangeBlocked}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className={fieldLabelClassName}>Account status</span>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value as typeof statusOptions[number]["value"])}
              className={fieldClassName}
              disabled={isPending || isStatusChangeBlocked}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-[1rem] border border-border/70 bg-muted/25 px-4 py-2">
            <p className="admin-kicker-label">
              Selected access scope
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <AdminUserRoleBadge role={selectedRole} />
              <p className="admin-meta-text">{roleHelperCopy[selectedRole]}</p>
            </div>
            <p className="admin-meta-text mt-2">
              Status after save: {selectedStatus === "active" ? "Active users can sign in and use allowed modules." : "Inactive users cannot sign in and will lose access on their next protected request."}
            </p>
          </div>

          {isSelf ? (
            <div className="rounded-[1rem] border border-amber-300 bg-amber-50 px-4 py-2 text-[11px] leading-4 text-amber-900">
              Your own role and account status cannot be changed from this screen.
            </div>
          ) : null}

          {isProtectedSuperAdmin ? (
            <div className="rounded-[1rem] border border-amber-300 bg-amber-50 px-4 py-2 text-[11px] leading-4 text-amber-900">
              This account is the last active Super Admin. At least one active Super Admin must remain available.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[1rem] border border-destructive/25 bg-destructive/8 px-4 py-2 text-[11px] leading-4 text-destructive">
              {error}
            </div>
          ) : null}

          {temporaryPassword ? (
            <AdminUserTemporaryPasswordPanel
              password={temporaryPassword}
              title="Temporary password reset"
              description="The user must change this password after the next sign-in."
            />
          ) : null}

          {!isSelf ? (
            <div className="rounded-[1rem] border border-border/70 bg-white px-4 py-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="admin-card-title">Reset password</p>
                  <p className="admin-meta-text mt-1">
                    Generate a new temporary password and require a password change on next login.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="admin-button-text h-8 rounded-full px-3"
                  disabled={isPending}
                  onClick={handlePasswordReset}
                >
                  Reset password
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end border-t border-border/70 pt-3">
            <Button
              type="button"
              size="sm"
              className="admin-button-text rounded-full px-3"
              disabled={isPending || isSelf || !hasChanges}
              onClick={handleSubmit}
            >
              {isPending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Saving changes
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </AdminDrawer>
  );
}

function getAdminUserAccessErrorMessage(error: BackendApiError) {
  if (error.code === "last_super_admin") {
    return "At least one active Super Admin is required.";
  }

  if (error.code === "self_access_change_not_allowed" || error.code === "self_role_change_not_allowed") {
    return "You cannot change your own role or account status from this screen.";
  }

  if (error.code === "forbidden_admin") {
    return "You do not have permission to update this user.";
  }

  if (error.code === "password_reset_self_not_allowed") {
    return "Use the password change flow for your own account.";
  }

  return error.message || "Unable to update user access";
}
