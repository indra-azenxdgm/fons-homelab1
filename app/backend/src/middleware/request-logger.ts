import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

import { logger } from "@/lib/logger";

function getRequestId(request: Request) {
  const headerValue = request.headers["x-request-id"];
  const value = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return value || randomUUID();
}

export function requestLogger(request: Request, response: Response, next: NextFunction) {
  const startedAt = Date.now();
  const requestId = getRequestId(request);

  response.locals.requestId = requestId;
  response.setHeader("x-request-id", requestId);

  response.on("finish", () => {
    logger.info("request.completed", {
      requestId,
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
}
