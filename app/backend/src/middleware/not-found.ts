import type { Request, Response } from "express";

import { sendApiError } from "@/controllers/controller-helpers";

export function notFoundHandler(request: Request, response: Response) {
  sendApiError(response, {
    status: 404,
    category: "validation",
    code: "route_not_found",
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  });
}
