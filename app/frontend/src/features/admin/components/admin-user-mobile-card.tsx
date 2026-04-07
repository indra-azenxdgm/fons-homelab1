import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AdminUserListItem } from "@/features/admin/lib/shared/admin-user-types";
import { AdminUserPasswordBadge } from "@/features/admin/components/admin-user-password-badge";
import { AdminUserRoleBadge } from "@/features/admin/components/admin-user-role-badge";
import { AdminUserStatusBadge } from "@/features/admin/components/admin-user-status-badge";

type AdminUserMobileCardProps = {
  user: AdminUserListItem;
  canDelete: boolean;
  onEdit: (user: AdminUserListItem) => void;
  onDelete?: (user: AdminUserListItem) => void;
};

const userDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function AdminUserMobileCard({ user, canDelete, onEdit, onDelete }: AdminUserMobileCardProps) {
  const formatDate = (value: Date | string) =>
    userDateFormatter.format(new Date(value));

  return (
    <article className="rounded-[1.1rem] border border-border/70 bg-white/94 px-3.5 py-3 shadow-[0_12px_24px_-26px_rgba(15,23,42,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold leading-5 text-foreground">{user.name}</p>
          <p className="mt-1 truncate text-[12px] leading-5 text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <AdminUserRoleBadge role={user.role} />
            <AdminUserStatusBadge isActive={user.isActive} />
            <AdminUserPasswordBadge mustChangePassword={user.mustChangePassword} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit role for ${user.name}`}
            title={`Edit role for ${user.name}`}
            onClick={() => onEdit(user)}
            className="rounded-full border border-transparent text-muted-foreground hover:border-primary/20 hover:bg-primary/[0.08] hover:text-primary"
          >
            <Pencil className="size-3.5" />
          </Button>
          {canDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${user.name}`}
              title={`Delete ${user.name}`}
              onClick={() => onDelete?.(user)}
              className="rounded-full border border-transparent text-muted-foreground hover:border-destructive/20 hover:bg-destructive/8 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-4 text-muted-foreground">
        <span>Joined: {formatDate(user.createdAt)}</span>
        <span className="text-border">|</span>
        <span>Last login: {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}</span>
      </div>
    </article>
  );
}
