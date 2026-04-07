"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { adminTableActionsCellClassName, adminTableActionsHeaderClassName } from "@/features/admin/components/admin-table-actions";

import { pushAppToast } from "@/components/app-toast-viewport";
import { Button } from "@/components/ui/button";
import { BackendApiError, deleteAdminUserBrowser } from "@/features/admin/api/admin-browser-api";
import { AdminUserMobileCard } from "@/features/admin/components/admin-user-mobile-card";
import { AdminUserPasswordBadge } from "@/features/admin/components/admin-user-password-badge";
import { AdminUserRoleBadge } from "@/features/admin/components/admin-user-role-badge";
import { AdminUserRoleDrawer } from "@/features/admin/components/admin-user-role-drawer";
import { AdminUserStatusBadge } from "@/features/admin/components/admin-user-status-badge";
import type { AdminUserListItem } from "@/features/admin/lib/shared/admin-user-types";

type AdminUserRolesListProps = {
  users: AdminUserListItem[];
  currentAdminUserId: string;
  currentAdminUserRole: "SUPER_ADMIN" | "ADMIN" | "SQUAD";
  totalCount: number;
  page: number;
  totalPages: number;
  q?: string;
  role?: string;
  status?: string;
};

const userDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function buildUsersPageHref({
  page,
  q,
  role,
  status,
}: {
  page: number;
  q?: string;
  role?: string;
  status?: string;
}) {
  const params = new URLSearchParams();

  if (q) {
    params.set("q", q);
  }

  if (role) {
    params.set("role", role);
  }

  if (status) {
    params.set("status", status);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/admin/user-roles?${query}` : "/admin/user-roles";
}

export function AdminUserRolesList({
  users,
  currentAdminUserId,
  currentAdminUserRole,
  totalCount,
  page,
  totalPages,
  q,
  role,
  status,
}: AdminUserRolesListProps) {
  const router = useRouter();
  const [userItems, setUserItems] = useState(users);
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [userPendingDelete, setUserPendingDelete] = useState<AdminUserListItem | null>(null);
  const [isDeletePending, startDeleteTransition] = useTransition();
  void totalCount;
  const formatDate = (value: Date | string) =>
    userDateFormatter.format(new Date(value));
  const canDeleteUsers = currentAdminUserRole === "SUPER_ADMIN";

  useEffect(() => {
    setUserItems(users);
  }, [users]);

  function handleDeleteRequest(user: AdminUserListItem) {
    if (!canDeleteUsers) {
      return;
    }

    setUserPendingDelete(user);
  }

  function handleDeleteConfirm() {
    if (!userPendingDelete) {
      return;
    }

    startDeleteTransition(async () => {
      try {
        await deleteAdminUserBrowser(userPendingDelete.id);
        setUserItems((current) => current.filter((item) => item.id !== userPendingDelete.id));
        setSelectedUser((current) => (current?.id === userPendingDelete.id ? null : current));
        setUserPendingDelete(null);
        pushAppToast({
          title: "User deleted",
          description: `${userPendingDelete.name} has been removed from User & Roles.`,
        });
        router.refresh();
      } catch (error) {
        const message = error instanceof BackendApiError
          ? getAdminUserDeleteErrorMessage(error)
          : "Unable to delete user";

        pushAppToast({
          title: "Delete failed",
          description: message,
        });
      }
    });
  }

  if (userItems.length === 0) {
    return (
      <section className="rounded-[1.6rem] border border-dashed border-border/80 bg-white/80 p-8 text-center">
        <p className="admin-empty-title">No users found</p>
        <p className="admin-empty-copy mt-2">
          Adjust the search or filters to find a matching account.
        </p>
      </section>
    );
  }

  return (
      <>
        <section className="grid gap-2.5 lg:hidden">
        {userItems.map((user) => (
          <AdminUserMobileCard
            key={user.id}
            user={user}
            canDelete={canDeleteUsers && user.id !== currentAdminUserId}
            onEdit={setSelectedUser}
            onDelete={handleDeleteRequest}
          />
        ))}
      </section>

      <section className="hidden overflow-hidden rounded-[1.6rem] border border-border/70 bg-white/94 shadow-[0_20px_44px_-36px_rgba(15,23,42,0.2)] lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-[11px] leading-4">
            <thead className="bg-muted/45 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 leading-4 font-medium">Name</th>
                <th className="px-3 py-2 leading-4 font-medium">Email</th>
                <th className="px-3 py-2 leading-4 font-medium">Role</th>
                <th className="px-3 py-2 leading-4 font-medium">Status</th>
                <th className="px-3 py-2 leading-4 font-medium">Joined</th>
                <th className="px-3 py-2 leading-4 font-medium">Last login</th>
                <th className={adminTableActionsHeaderClassName}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {userItems.map((user) => (
                <tr key={user.id} className="border-t border-border/70 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="mt-1 text-[9px] text-muted-foreground">
                        Joined {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </td>
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminUserRoleBadge role={user.role} />
                      <AdminUserPasswordBadge mustChangePassword={user.mustChangePassword} />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <AdminUserStatusBadge isActive={user.isActive} />
                  </td>
                  <td className="px-3 py-2">{formatDate(user.createdAt)}</td>
                  <td className="px-3 py-2">{user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}</td>
                  <td className={adminTableActionsCellClassName}>
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit role for ${user.name}`}
                        title={`Edit role for ${user.name}`}
                        onClick={() => setSelectedUser(user)}
                        className="rounded-full border border-transparent text-muted-foreground hover:border-primary/20 hover:bg-primary/[0.08] hover:text-primary"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      {canDeleteUsers && user.id !== currentAdminUserId ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${user.name}`}
                          title={`Delete ${user.name}`}
                          onClick={() => handleDeleteRequest(user)}
                          className="rounded-full border border-transparent text-muted-foreground hover:border-destructive/20 hover:bg-destructive/8 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {totalPages > 1 ? (
        <nav className="flex items-center justify-between rounded-[1.1rem] border border-border/70 bg-white/82 px-3.5 py-3 shadow-[0_12px_28px_-28px_rgba(15,23,42,0.16)] sm:px-4">
          <Link
            href={buildUsersPageHref({ page: Math.max(1, page - 1), q, role, status })}
            aria-disabled={page <= 1}
            className={`admin-pagination-button ${
              page <= 1
                ? "pointer-events-none border-border/60 text-muted-foreground/50"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            Previous
          </Link>

          <p className="admin-pagination-text text-center">
            Page {page} of {totalPages}
          </p>

          <Link
            href={buildUsersPageHref({ page: Math.min(totalPages, page + 1), q, role, status })}
            aria-disabled={page >= totalPages}
            className={`admin-pagination-button ${
              page >= totalPages
                ? "pointer-events-none border-border/60 text-muted-foreground/50"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            Next
          </Link>
        </nav>
      ) : null}

      <AdminUserRoleDrawer
        key={selectedUser?.id || "empty"}
        user={selectedUser}
        currentAdminUserId={currentAdminUserId}
        onUserUpdated={(nextUser) => {
          setSelectedUser(nextUser);
          setUserItems((current) => current.map((item) => (item.id === nextUser.id ? nextUser : item)));
        }}
        open={Boolean(selectedUser)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null);
          }
        }}
      />

      <Dialog.Root open={Boolean(userPendingDelete)} onOpenChange={(open) => {
        if (!open) {
          setUserPendingDelete(null);
        }
      }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[70] bg-slate-950/26 transition data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-[80] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[1.4rem] border border-border/80 bg-white p-5 shadow-[0_22px_42px_-28px_rgba(15,23,42,0.28)] outline-none transition data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <Dialog.Title className="text-[1rem] font-semibold leading-5 text-foreground">
              Delete user?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-[13px] leading-5 text-muted-foreground">
              {userPendingDelete
                ? `This action will permanently remove ${userPendingDelete.name} (${userPendingDelete.email}).`
                : "This action will permanently remove this user account."}
            </Dialog.Description>

            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="admin-button-text rounded-full px-3"
                    disabled={isDeletePending}
                  />
                }
              >
                Cancel
              </Dialog.Close>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="admin-button-text rounded-full px-3"
                disabled={isDeletePending}
                onClick={handleDeleteConfirm}
              >
                Delete
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function getAdminUserDeleteErrorMessage(error: BackendApiError) {
  if (error.code === "forbidden_admin") {
    return "Only Super Admin can delete users.";
  }

  if (error.code === "user_delete_self_not_allowed") {
    return "You cannot delete your own account.";
  }

  if (error.code === "last_super_admin_delete_not_allowed") {
    return "At least one active Super Admin must remain available.";
  }

  if (error.code === "admin_user_not_found") {
    return "This user could not be found anymore.";
  }

  return error.message || "Unable to delete user";
}
