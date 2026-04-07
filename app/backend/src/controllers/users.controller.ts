import type { Request, Response } from "express";

import { getRouteParam, sendZodValidationError } from "@/controllers/controller-helpers";
import { getAuthenticatedAdmin } from "@/middleware/auth";
import { createUser, deleteUser, listAdminUsers, patchAdminUserRole, resetUserPassword } from "@/services/users.service";
import {
  adminUserCreateSchema,
  adminUserListQuerySchema,
  adminUserRolePatchSchema,
  userIdParamSchema,
} from "@/validation/api-schemas";

export async function getAdminUsers(request: Request, response: Response) {
  const parsedQuery = adminUserListQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    sendZodValidationError(response, parsedQuery.error, "User filters are not valid.");
    return;
  }

  const filters = Object.fromEntries(
    Object.entries(parsedQuery.data).map(([key, value]) => [key, value == null ? undefined : String(value)]),
  ) as Record<string, string | undefined>;

  response.json(await listAdminUsers(filters));
}

export async function updateAdminUserRole(request: Request, response: Response) {
  const parsedParams = userIdParamSchema.safeParse({ userId: getRouteParam(request, "userId") });

  if (!parsedParams.success) {
    sendZodValidationError(response, parsedParams.error, "User id is not valid.");
    return;
  }

  const parsedBody = adminUserRolePatchSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "Role update is not valid.");
    return;
  }

  const adminUser = getAuthenticatedAdmin(response);

  if (!adminUser) {
    response.status(401).json({
      error: {
        category: "security",
        code: "unauthorized_admin",
        message: "Unauthorized",
      },
    });
    return;
  }

  const user = await patchAdminUserRole(
    parsedParams.data.userId,
    parsedBody.data.role,
    parsedBody.data.isActive,
    adminUser.id,
  );

  response.json({
    success: true,
    user,
  });
}

export async function createAdminUser(request: Request, response: Response) {
  const parsedBody = adminUserCreateSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "User details are not valid.");
    return;
  }

  const adminUser = getAuthenticatedAdmin(response);

  if (!adminUser) {
    response.status(401).json({
      error: {
        category: "security",
        code: "unauthorized_admin",
        message: "Unauthorized",
      },
    });
    return;
  }

  const result = await createUser({
    ...parsedBody.data,
    actingAdminUserId: adminUser.id,
  });

  response.status(201).json({
    success: true,
    user: result.user,
    temporaryPassword: result.temporaryPassword,
  });
}

export async function resetAdminUserPassword(request: Request, response: Response) {
  const parsedParams = userIdParamSchema.safeParse({ userId: getRouteParam(request, "userId") });

  if (!parsedParams.success) {
    sendZodValidationError(response, parsedParams.error, "User id is not valid.");
    return;
  }

  const adminUser = getAuthenticatedAdmin(response);

  if (!adminUser) {
    response.status(401).json({
      error: {
        category: "security",
        code: "unauthorized_admin",
        message: "Unauthorized",
      },
    });
    return;
  }

  const result = await resetUserPassword(parsedParams.data.userId, adminUser.id);

  response.json({
    success: true,
    user: result.user,
    temporaryPassword: result.temporaryPassword,
  });
}

export async function deleteAdminUser(request: Request, response: Response) {
  const parsedParams = userIdParamSchema.safeParse({ userId: getRouteParam(request, "userId") });

  if (!parsedParams.success) {
    sendZodValidationError(response, parsedParams.error, "User id is not valid.");
    return;
  }

  const adminUser = getAuthenticatedAdmin(response);

  if (!adminUser) {
    response.status(401).json({
      error: {
        category: "security",
        code: "unauthorized_admin",
        message: "Unauthorized",
      },
    });
    return;
  }

  if (adminUser.role !== "SUPER_ADMIN") {
    response.status(403).json({
      error: {
        category: "security",
        code: "forbidden_admin",
        message: "Forbidden",
      },
    });
    return;
  }

  const deletedUser = await deleteUser(parsedParams.data.userId, adminUser.id);

  response.json({
    success: true,
    user: deletedUser,
  });
}
