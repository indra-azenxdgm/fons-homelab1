import type { AdminRole } from "@prisma/client";

import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  resetAdminUserPassword,
  updateAdminUserRole,
} from "@/features/admin/lib/server/admin-service";

export async function listAdminUsers(filters: Record<string, string | undefined>) {
  return getAdminUsers(filters);
}

export async function patchAdminUserRole(
  userId: string,
  role: AdminRole,
  isActive: boolean,
  actingAdminUserId: string,
) {
  return updateAdminUserRole(userId, role, isActive, actingAdminUserId);
}

export async function createUser(input: {
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  actingAdminUserId: string;
}) {
  return createAdminUser(input);
}

export async function resetUserPassword(
  userId: string,
  actingAdminUserId: string,
) {
  return resetAdminUserPassword(userId, actingAdminUserId);
}

export async function deleteUser(
  userId: string,
  actingAdminUserId: string,
) {
  return deleteAdminUser(userId, actingAdminUserId);
}
