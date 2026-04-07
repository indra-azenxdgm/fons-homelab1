import type { AdminPermission, AdminRole } from "@/features/admin/lib/contracts";

export const adminPermissions: AdminPermission[] = [
  "dashboard.read",
  "bookings.read",
  "bookings.update",
  "finance.read",
  "finance.manage",
  "customers.read",
  "squads.read",
  "squads.manage",
  "reports.read",
  "settings.manage",
  "users.manage",
];

const fullAccessPermissions = new Set<AdminPermission>(adminPermissions);

export const adminRolePermissions: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  SUPER_ADMIN: fullAccessPermissions,
  ADMIN: new Set<AdminPermission>([
    "dashboard.read",
    "bookings.read",
    "bookings.update",
    "finance.read",
    "finance.manage",
    "customers.read",
    "squads.read",
    "squads.manage",
  ]),
  SQUAD: new Set<AdminPermission>([
    "dashboard.read",
    "bookings.read",
  ]),
};

export function hasPermission(
  role: AdminRole,
  permission: AdminPermission,
) {
  return adminRolePermissions[role].has(permission);
}

export function hasAnyPermission(
  role: AdminRole,
  permissions: AdminPermission[],
) {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(
  role: AdminRole,
  permissions: AdminPermission[],
) {
  return permissions.every((permission) => hasPermission(role, permission));
}

export type { AdminPermission, AdminRole };
