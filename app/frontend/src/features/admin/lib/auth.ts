import "server-only";

import { cookies } from "next/headers";

import { fetchBackendJson, BackendApiError } from "@/lib/api-client";
import {
  hasAllPermissions,
  hasAnyPermission,
  type AdminPermission,
  type AdminRole,
} from "@/features/admin/lib/permissions";
import { ADMIN_SESSION_COOKIE } from "@/features/admin/lib/session";
import type { AdminShellUser } from "@/features/admin/lib/contracts";

export type AdminSessionUser = AdminShellUser;

export async function getAdminAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value || null;
}

export async function getCurrentAdminUser() {
  const token = await getAdminAuthToken();

  if (!token) {
    return null;
  }

  try {
    const response = await fetchBackendJson<{ adminUser: AdminSessionUser }>("/api/admin/auth/me", {
      authToken: token,
    });

    return response.adminUser;
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export async function isAdminAuthenticated() {
  const adminUser = await getCurrentAdminUser();
  return Boolean(adminUser);
}

export async function requireAdminAuth(allowedRoles?: AdminRole[]) {
  const adminUser = await getCurrentAdminUser();

  if (!adminUser) {
    throw new Error("UNAUTHORIZED_ADMIN");
  }

  if (allowedRoles?.length && !allowedRoles.includes(adminUser.role)) {
    throw new Error("FORBIDDEN_ADMIN");
  }

  return adminUser;
}

export function adminHasPermission(
  adminUser: Pick<AdminSessionUser, "role">,
  permission: AdminPermission,
) {
  return hasAnyPermission(adminUser.role, [permission]);
}

export function adminHasAnyPermission(
  adminUser: Pick<AdminSessionUser, "role">,
  permissions: AdminPermission[],
) {
  return hasAnyPermission(adminUser.role, permissions);
}

export function adminHasAllPermissions(
  adminUser: Pick<AdminSessionUser, "role">,
  permissions: AdminPermission[],
) {
  return hasAllPermissions(adminUser.role, permissions);
}

export async function requirePermission(permission: AdminPermission) {
  const adminUser = await requireAdminAuth();

  if (!adminHasPermission(adminUser, permission)) {
    throw new Error("FORBIDDEN_ADMIN");
  }

  return adminUser;
}

export async function requireAnyPermission(permissions: AdminPermission[]) {
  const adminUser = await requireAdminAuth();

  if (!adminHasAnyPermission(adminUser, permissions)) {
    throw new Error("FORBIDDEN_ADMIN");
  }

  return adminUser;
}

export async function requireAllPermissions(permissions: AdminPermission[]) {
  const adminUser = await requireAdminAuth();

  if (!adminHasAllPermissions(adminUser, permissions)) {
    throw new Error("FORBIDDEN_ADMIN");
  }

  return adminUser;
}

export type { AdminPermission, AdminRole };
