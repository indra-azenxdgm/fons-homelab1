import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { ApiError, mapKnownError, sendApiError, sendZodValidationError } from "@/controllers/controller-helpers";
import { logger } from "@/lib/logger";

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (mapKnownError(response, error)) {
    return;
  }

  if (error instanceof ZodError) {
    sendZodValidationError(response, error, "Invalid request.");
    return;
  }

  if (error instanceof ApiError) {
    sendApiError(response, error);
    return;
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  logger.error("request.failed", {
    requestId: response.locals.requestId,
    path: _request.originalUrl,
    method: _request.method,
    message,
    stack: process.env.NODE_ENV === "production"
      ? undefined
      : (error instanceof Error ? error.stack : undefined),
  });
  sendApiError(response, {
    status: 500,
    category: "system",
    code: "internal_server_error",
    message: "Internal server error",
  });
}
