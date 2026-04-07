import type { NextFunction, Request, Response } from "express";

import {
  requireAdminAuthFromToken,
  requireAdminPermissionFromToken,
  type AdminSessionUser,
} from "@/features/admin/lib/auth";
import type { AdminPermission, AdminRole } from "@/features/admin/lib/contracts";

const ADMIN_SESSION_COOKIE = "fons_admin_token";

function getBearerToken(request: Request) {
  const header = request.headers.authorization;

  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token || null : null;
}

function getCookieToken(request: Request) {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((entry) => entry.trim());
  const sessionEntry = cookies.find((entry) => entry.startsWith(`${ADMIN_SESSION_COOKIE}=`));

  if (!sessionEntry) {
    return null;
  }

  return decodeURIComponent(sessionEntry.slice(`${ADMIN_SESSION_COOKIE}=`.length));
}

export function getRequiredAdminToken(request: Request) {
  return getBearerToken(request) || getCookieToken(request);
}

export function getAuthenticatedAdmin(response: Response) {
  return response.locals.adminUser as AdminSessionUser | undefined;
}

export function requireAdminAuth(allowedRoles?: AdminRole[]) {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      response.locals.adminUser = await requireAdminAuthFromToken(
        getRequiredAdminToken(request),
        allowedRoles,
      );
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAdminPermission(permission: AdminPermission) {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      response.locals.adminUser = await requireAdminPermissionFromToken(
        getRequiredAdminToken(request),
        permission,
      );
      next();
    } catch (error) {
      next(error);
    }
  };
}
