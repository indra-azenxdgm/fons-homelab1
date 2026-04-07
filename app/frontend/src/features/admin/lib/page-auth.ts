import "server-only";

import { redirect } from "next/navigation";

import {
  adminHasPermission,
  getCurrentAdminUser,
  requireAnyPermission,
  requirePermission,
} from "@/features/admin/lib/auth";
import type { AdminPermission } from "@/features/admin/lib/permissions";

async function handlePageAuthorizationError(error: unknown): Promise<never> {
  if (error instanceof Error && error.message === "UNAUTHORIZED_ADMIN") {
    redirect("/admin/login");
  }

  if (error instanceof Error && error.message === "FORBIDDEN_ADMIN") {
    const adminUser = await getCurrentAdminUser();

    if (!adminUser) {
      redirect("/admin/login");
    }

    if (adminHasPermission(adminUser, "bookings.read")) {
      redirect("/admin/bookings");
    }

    if (adminHasPermission(adminUser, "dashboard.read")) {
      redirect("/admin/dashboard");
    }

    redirect("/admin/forbidden");
  }

  throw error;
}

export async function requireAdminPagePermission(
  permission: AdminPermission,
): Promise<Awaited<ReturnType<typeof requirePermission>>> {
  try {
    return await requirePermission(permission);
  } catch (error) {
    return await handlePageAuthorizationError(error);
  }
}

export async function requireAdminPageAnyPermission(
  permissions: AdminPermission[],
): Promise<Awaited<ReturnType<typeof requireAnyPermission>>> {
  try {
    return await requireAnyPermission(permissions);
  } catch (error) {
    return await handlePageAuthorizationError(error);
  }
}
