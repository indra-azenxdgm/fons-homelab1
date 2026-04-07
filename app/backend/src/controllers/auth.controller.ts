import type { Request, Response } from "express";

import { sendApiError } from "@/controllers/controller-helpers";
import { logger } from "@/lib/logger";
import { BACKEND_RATE_LIMIT_POLICIES, BackendRateLimitError, enforceBackendRateLimit } from "@/middleware/rate-limit";
import { getAuthenticatedAdmin, getRequiredAdminToken } from "@/middleware/auth";
import { ADMIN_SESSION_MAX_AGE_SECONDS } from "@/features/admin/lib/auth";
import { changeAuthenticatedAdminPassword, getAuthenticatedAdminUser, loginAdmin, logoutAdmin } from "@/services/auth.service";
import { adminLoginSchema, adminUserPasswordChangeSchema } from "@/validation/api-schemas";

const ADMIN_SESSION_COOKIE = "fons_admin_token";

function shouldUseSecureCookie() {
  return process.env.NODE_ENV === "production";
}

export async function login(request: Request, response: Response) {
  try {
    enforceBackendRateLimit(request, BACKEND_RATE_LIMIT_POLICIES.adminLogin);
  } catch (error) {
    if (error instanceof BackendRateLimitError) {
      response.setHeader("retry-after", String(error.retryAfterSeconds));
      sendApiError(response, {
        status: error.status,
        category: "rate_limit",
        code: error.code,
        message: error.message,
      });
      return;
    }

    throw error;
  }

  const parsedBody = adminLoginSchema.safeParse(request.body);

  if (!parsedBody.success) {
    logger.warn("admin.login.invalid_payload", {
      requestId: response.locals.requestId,
      path: request.originalUrl,
    });
    sendApiError(response, {
      status: 400,
      category: "validation",
      code: "invalid_admin_credentials_payload",
      message: "Enter a valid email and password",
    });
    return;
  }

  const authentication = await loginAdmin(parsedBody.data.email, parsedBody.data.password, {
    ipAddress: request.ip || null,
    userAgent: request.headers["user-agent"] || null,
  });

  if (!authentication.ok) {
    logger.warn("admin.login.failed", {
      requestId: response.locals.requestId,
      path: request.originalUrl,
      email: parsedBody.data.email.trim().toLowerCase(),
      reason: authentication.reason,
    });
    sendApiError(response, authentication.reason === "inactive_admin"
      ? {
          status: 403,
          category: "security",
          code: "inactive_admin",
          message: "Your account is inactive",
        }
      : {
          status: 401,
          category: "security",
          code: "invalid_admin_credentials",
          message: "Invalid admin credentials",
        });
    return;
  }

  response.cookie(ADMIN_SESSION_COOKIE, authentication.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
  });

  response.json({
    token: authentication.token,
    adminUser: authentication.adminUser,
  });

  logger.info("admin.login.succeeded", {
    requestId: response.locals.requestId,
    path: request.originalUrl,
    adminUserId: authentication.adminUser.id,
    email: authentication.adminUser.email,
  });
}

export async function me(request: Request, response: Response) {
  const adminUser = await getAuthenticatedAdminUser(getRequiredAdminToken(request));

  if (!adminUser) {
    sendApiError(response, {
      status: 401,
      category: "security",
      code: "unauthorized_admin",
      message: "Unauthorized",
    });
    return;
  }

  response.json({ adminUser });
}

export async function changePassword(request: Request, response: Response) {
  const parsedBody = adminUserPasswordChangeSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendApiError(response, {
      status: 400,
      category: "validation",
      code: "invalid_password_change_payload",
      message: "Password change details are not valid",
      fieldErrors: parsedBody.error.flatten().fieldErrors,
      formErrors: parsedBody.error.flatten().formErrors,
    });
    return;
  }

  const adminUser = getAuthenticatedAdmin(response);

  if (!adminUser) {
    sendApiError(response, {
      status: 401,
      category: "security",
      code: "unauthorized_admin",
      message: "Unauthorized",
    });
    return;
  }

  await changeAuthenticatedAdminPassword(
    adminUser.id,
    parsedBody.data.currentPassword,
    parsedBody.data.newPassword,
    {
      currentSessionToken: getRequiredAdminToken(request),
    },
  );

  response.json({ success: true });
}

export async function logout(request: Request, response: Response) {
  await logoutAdmin(getRequiredAdminToken(request));
  response.clearCookie(ADMIN_SESSION_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
  });
  response.json({ success: true });
}
