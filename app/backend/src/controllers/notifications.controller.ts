import type { Request, Response } from "express";

import { getRouteParam, sendZodValidationError } from "@/controllers/controller-helpers";
import { getAuthenticatedAdmin } from "@/middleware/auth";
import {
  bulkArchiveAdminNotifications,
  bulkMarkAdminNotificationsAsRead,
  bulkRestoreAdminNotifications,
  getAdminNotificationOverview,
  getAdminNotificationRules,
  getAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  updateAdminNotificationPreferences,
  updateAdminNotificationRules,
} from "@/services/notifications.service";
import {
  adminNotificationBulkActionSchema,
  adminNotificationBulkArchiveSchema,
  adminNotificationIdParamSchema,
  adminNotificationListQuerySchema,
  adminNotificationPreferencesPatchSchema,
  adminNotificationRulesPatchSchema,
} from "@/validation/api-schemas";

export async function listAdminNotifications(request: Request, response: Response) {
  const parsedQuery = adminNotificationListQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    sendZodValidationError(response, parsedQuery.error, "Notification filters are not valid.");
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

  const notifications = await getAdminNotifications({
    adminUserId: adminUser.id,
    page: typeof parsedQuery.data.page === "number" ? parsedQuery.data.page : undefined,
    pageSize: typeof parsedQuery.data.limit === "number" ? parsedQuery.data.limit : undefined,
    view:
      parsedQuery.data.view === "active" || parsedQuery.data.view === "archived"
        ? parsedQuery.data.view
        : undefined,
    status:
      parsedQuery.data.status === "read" || parsedQuery.data.status === "unread"
        ? parsedQuery.data.status
        : undefined,
  });

  response.json(notifications);
}

export async function getAdminNotificationsOverview(
  _request: Request,
  response: Response,
) {
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

  const overview = await getAdminNotificationOverview(adminUser.id);
  response.json(overview);
}

export async function getAdminNotificationsRules(
  _request: Request,
  response: Response,
) {
  const rules = await getAdminNotificationRules();
  response.json({
    rules,
  });
}

export async function patchAdminNotificationRead(request: Request, response: Response) {
  const parsedParams = adminNotificationIdParamSchema.safeParse({
    notificationId: getRouteParam(request, "notificationId"),
  });

  if (!parsedParams.success) {
    sendZodValidationError(response, parsedParams.error, "Notification id is not valid.");
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

  const notification = await markAdminNotificationAsRead({
    adminUserId: adminUser.id,
    notificationId: parsedParams.data.notificationId,
  });

  response.json({
    success: true,
    notification,
  });
}

export async function postAdminNotificationsReadAll(
  _request: Request,
  response: Response,
) {
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

  const result = await markAllAdminNotificationsAsRead(adminUser.id);

  response.json({
    success: true,
    ...result,
  });
}

export async function patchAdminNotificationPreferences(
  request: Request,
  response: Response,
) {
  const parsedBody = adminNotificationPreferencesPatchSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "Notification preferences are not valid.");
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

  const result = await updateAdminNotificationPreferences({
    adminUserId: adminUser.id,
    ...parsedBody.data,
  });

  response.json({
    success: true,
    ...result,
  });
}

export async function postAdminNotificationsBulkRead(
  request: Request,
  response: Response,
) {
  const parsedBody = adminNotificationBulkActionSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "Notification selection is not valid.");
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

  const result = await bulkMarkAdminNotificationsAsRead({
    adminUserId: adminUser.id,
    notificationIds: parsedBody.data.ids,
  });

  response.json({
    success: true,
    ...result,
  });
}

export async function postAdminNotificationsBulkArchive(
  request: Request,
  response: Response,
) {
  const parsedBody = adminNotificationBulkArchiveSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "Notification selection is not valid.");
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

  const result = await bulkArchiveAdminNotifications({
    adminUserId: adminUser.id,
    notificationIds: parsedBody.data.ids,
    readOnly: parsedBody.data.readOnly,
  });

  response.json({
    success: true,
    ...result,
  });
}

export async function postAdminNotificationsBulkRestore(
  request: Request,
  response: Response,
) {
  const parsedBody = adminNotificationBulkActionSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "Notification selection is not valid.");
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

  const result = await bulkRestoreAdminNotifications({
    adminUserId: adminUser.id,
    notificationIds: parsedBody.data.ids,
  });

  response.json({
    success: true,
    ...result,
  });
}

export async function patchAdminNotificationsRules(
  request: Request,
  response: Response,
) {
  const parsedBody = adminNotificationRulesPatchSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "Notification rules are not valid.");
    return;
  }

  const rules = await updateAdminNotificationRules(parsedBody.data);

  response.json({
    success: true,
    rules,
  });
}
