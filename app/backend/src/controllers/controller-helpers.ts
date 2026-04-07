import type { Request, Response } from "express";
import { ZodError } from "zod";

import { AdminAuthorizationError } from "@/features/admin/lib/auth";

export type ApiErrorInput = {
  status: number;
  category: "validation" | "conflict" | "rate_limit" | "security" | "system";
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
};

export class ApiError extends Error {
  status: number;
  category: ApiErrorInput["category"];
  code: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];

  constructor(input: ApiErrorInput) {
    super(input.message);
    this.name = "ApiError";
    this.status = input.status;
    this.category = input.category;
    this.code = input.code;
    this.fieldErrors = input.fieldErrors;
    this.formErrors = input.formErrors;
  }
}

export function getRouteParam(request: Request, key: string) {
  return Array.isArray(request.params[key]) ? request.params[key][0] : request.params[key];
}

export function sendPublicSuccess<T>(response: Response, data: T, status = 200) {
  response.status(status).json({
    ok: true,
    data,
  });
}

export function createApiError(input: ApiErrorInput) {
  return new ApiError(input);
}

export function sendApiError(response: Response, input: ApiErrorInput) {
  response.status(input.status).json({
    ok: false,
    error: {
      category: input.category,
      code: input.code,
      message: input.message,
      fieldErrors: input.fieldErrors,
      formErrors: input.formErrors,
    },
  });
}

export function sendZodValidationError(response: Response, error: ZodError, message: string) {
  const flattened = error.flatten();

  sendApiError(response, {
    status: 400,
    category: "validation",
    code: "invalid_request",
    message,
    fieldErrors: Object.keys(flattened.fieldErrors).length ? flattened.fieldErrors : undefined,
    formErrors: flattened.formErrors.length ? flattened.formErrors : undefined,
  });
}

export function formatDisplayName(displayName: string) {
  return displayName
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 6)
    .join(", ");
}

export function mapKnownError(response: Response, error: unknown) {
  if (error instanceof AdminAuthorizationError) {
    sendApiError(response, {
      status: error.status,
      category: "security",
      code: error.message === "FORBIDDEN_ADMIN" ? "forbidden_admin" : "unauthorized_admin",
      message: error.message === "FORBIDDEN_ADMIN" ? "Forbidden" : "Unauthorized",
    });
    return true;
  }

  if (error instanceof Error && error.message === "BOOKING_NOT_FOUND") {
    sendApiError(response, {
      status: 404,
      category: "validation",
      code: "booking_not_found",
      message: "Booking not found",
    });
    return true;
  }

  if (error instanceof Error && error.message === "SQUAD_NOT_FOUND") {
    sendApiError(response, {
      status: 400,
      category: "validation",
      code: "squad_not_found",
      message: "One or more selected squads are not available",
    });
    return true;
  }

  if (error instanceof Error && error.message === "SQUAD_NAME_REQUIRED") {
    sendApiError(response, {
      status: 400,
      category: "validation",
      code: "squad_name_required",
      message: "Squad name is required",
    });
    return true;
  }

  if (error instanceof Error && error.message === "SQUAD_DUPLICATE_NAME") {
    sendApiError(response, {
      status: 409,
      category: "conflict",
      code: "squad_duplicate_name",
      message: "Another squad with the same name already exists",
    });
    return true;
  }

  if (error instanceof Error && error.message === "SQUAD_ALIAS_CONFLICT") {
    sendApiError(response, {
      status: 409,
      category: "conflict",
      code: "squad_alias_conflict",
      message: "Generated alias already belongs to another squad",
    });
    return true;
  }

  if (error instanceof Error && error.message === "CUSTOMER_NOT_FOUND") {
    sendApiError(response, {
      status: 404,
      category: "validation",
      code: "customer_not_found",
      message: "Customer not found",
    });
    return true;
  }

  if (error instanceof Error && error.message === "INVALID_BOOKING_STATUS") {
    sendApiError(response, {
      status: 400,
      category: "validation",
      code: "invalid_booking_status",
      message: "Choose a valid booking status",
    });
    return true;
  }

  if (error instanceof Error && error.message === "SQUAD_INACTIVE") {
    sendApiError(response, {
      status: 400,
      category: "validation",
      code: "squad_inactive",
      message: "One or more selected squads are inactive",
    });
    return true;
  }

  if (error instanceof Error && error.message === "ADMIN_USER_NOT_FOUND") {
    sendApiError(response, {
      status: 404,
      category: "validation",
      code: "admin_user_not_found",
      message: "Admin user not found",
    });
    return true;
  }

  if (error instanceof Error && error.message === "ADMIN_NOTIFICATION_NOT_FOUND") {
    sendApiError(response, {
      status: 404,
      category: "validation",
      code: "admin_notification_not_found",
      message: "Notification not found",
    });
    return true;
  }

  if (error instanceof Error && error.message === "INCOME_NOT_FOUND") {
    sendApiError(response, {
      status: 404,
      category: "validation",
      code: "income_not_found",
      message: "Income record not found",
    });
    return true;
  }

  if (error instanceof Error && error.message === "EXPENSE_NOT_FOUND") {
    sendApiError(response, {
      status: 404,
      category: "validation",
      code: "expense_not_found",
      message: "Expense record not found",
    });
    return true;
  }

  if (error instanceof Error && error.message === "FINANCE_BOOKING_NOT_FOUND") {
    sendApiError(response, {
      status: 400,
      category: "validation",
      code: "finance_booking_not_found",
      message: "Selected booking could not be found",
    });
    return true;
  }

  if (error instanceof Error && error.message === "FINANCE_BOOKING_NOT_COMPLETED") {
    sendApiError(response, {
      status: 409,
      category: "validation",
      code: "finance_booking_not_completed",
      message: "Select a booking with Completed status before saving income",
    });
    return true;
  }

  if (error instanceof Error && error.message === "INCOME_ITEMS_REQUIRED") {
    sendApiError(response, {
      status: 400,
      category: "validation",
      code: "income_items_required",
      message: "Add at least one income item before saving",
    });
    return true;
  }

  if (error instanceof Error && error.message === "INCOME_ITEMS_INVALID") {
    sendApiError(response, {
      status: 400,
      category: "validation",
      code: "income_items_invalid",
      message: "Every income item must include a description and amount greater than 0",
    });
    return true;
  }

  if (error instanceof Error && error.message === "INCOME_BILL_NUMBER_CONFLICT") {
    sendApiError(response, {
      status: 409,
      category: "conflict",
      code: "income_bill_number_conflict",
      message: "Another income record already uses this bill number",
    });
    return true;
  }

  if (error instanceof Error && error.message === "EXPENSE_BILL_CODE_CONFLICT") {
    sendApiError(response, {
      status: 409,
      category: "conflict",
      code: "expense_bill_code_conflict",
      message: "Another expense record already uses this bill code",
    });
    return true;
  }

  if (error instanceof Error && error.message === "EXPENSE_ITEMS_REQUIRED") {
    sendApiError(response, {
      status: 400,
      category: "validation",
      code: "expense_items_required",
      message: "Add at least one expense item before saving",
    });
    return true;
  }

  if (error instanceof Error && error.message === "EXPENSE_ITEMS_INVALID") {
    sendApiError(response, {
      status: 400,
      category: "validation",
      code: "expense_items_invalid",
      message: "Every expense item must include a description and amount greater than 0",
    });
    return true;
  }

  if (error instanceof Error && error.message === "LAST_SUPER_ADMIN") {
    sendApiError(response, {
      status: 409,
      category: "conflict",
      code: "last_super_admin",
      message: "At least one Super Admin must remain active",
    });
    return true;
  }

  if (error instanceof Error && error.message === "SELF_ROLE_CHANGE_NOT_ALLOWED") {
    sendApiError(response, {
      status: 403,
      category: "security",
      code: "self_role_change_not_allowed",
      message: "You cannot change your own role",
    });
    return true;
  }

  if (error instanceof Error && error.message === "SELF_ACCESS_CHANGE_NOT_ALLOWED") {
    sendApiError(response, {
      status: 403,
      category: "security",
      code: "self_access_change_not_allowed",
      message: "You cannot change your own role or account status",
    });
    return true;
  }

  if (error instanceof Error && error.message === "ADMIN_USER_EMAIL_CONFLICT") {
    sendApiError(response, {
      status: 409,
      category: "conflict",
      code: "admin_user_email_conflict",
      message: "Another user with this email already exists",
    });
    return true;
  }

  if (error instanceof Error && error.message === "PASSWORD_POLICY_INVALID") {
    sendApiError(response, {
      status: 400,
      category: "validation",
      code: "password_policy_invalid",
      message: "Password must be at least 10 characters long and include uppercase, lowercase, and numeric characters",
    });
    return true;
  }

  if (error instanceof Error && error.message === "CURRENT_PASSWORD_INVALID") {
    sendApiError(response, {
      status: 400,
      category: "validation",
      code: "current_password_invalid",
      message: "Current password is not correct",
    });
    return true;
  }

  if (error instanceof Error && error.message === "PASSWORD_RESET_SELF_NOT_ALLOWED") {
    sendApiError(response, {
      status: 403,
      category: "security",
      code: "password_reset_self_not_allowed",
      message: "Use the change password flow for your own account",
    });
    return true;
  }

  if (error instanceof Error && error.message === "USER_DELETE_SELF_NOT_ALLOWED") {
    sendApiError(response, {
      status: 409,
      category: "security",
      code: "user_delete_self_not_allowed",
      message: "You cannot delete your own account",
    });
    return true;
  }

  if (error instanceof Error && error.message === "LAST_SUPER_ADMIN_DELETE_NOT_ALLOWED") {
    sendApiError(response, {
      status: 409,
      category: "conflict",
      code: "last_super_admin_delete_not_allowed",
      message: "At least one active Super Admin must remain available",
    });
    return true;
  }

  return false;
}
