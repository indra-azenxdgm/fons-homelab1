import { cn } from "@/lib/utils";

type AdminUserRoleBadgeProps = {
  role: "SUPER_ADMIN" | "ADMIN" | "SQUAD";
};

const roleStyles: Record<AdminUserRoleBadgeProps["role"], string> = {
  SUPER_ADMIN: "border-primary/20 bg-primary text-primary-foreground shadow-[0_10px_20px_-16px_rgba(0,81,162,0.32)]",
  ADMIN: "border-[color:var(--border-strong)] bg-[color:var(--secondary)] text-[#0F4F8A]",
  SQUAD: "border-emerald-200/90 bg-emerald-50 text-emerald-800",
};

function formatRoleLabel(role: AdminUserRoleBadgeProps["role"]) {
  return role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export function AdminUserRoleBadge({ role }: AdminUserRoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[8px] leading-4 font-semibold uppercase tracking-[0.12em]",
        roleStyles[role],
      )}
    >
      {formatRoleLabel(role)}
    </span>
  );
}
