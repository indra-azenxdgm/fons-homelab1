import type { Request, Response } from "express";

import { createApiError, getRouteParam, sendZodValidationError } from "@/controllers/controller-helpers";
import { getCustomerDetail, listCustomers } from "@/services/customers.service";
import { customerIdParamSchema, customerListQuerySchema } from "@/validation/api-schemas";

export async function getAdminCustomers(request: Request, response: Response) {
  const parsedQuery = customerListQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    sendZodValidationError(response, parsedQuery.error, "Customer filters are not valid.");
    return;
  }

  const filters = Object.fromEntries(
    Object.entries(parsedQuery.data).map(([key, value]) => [key, value == null ? undefined : String(value)]),
  ) as Record<string, string | undefined>;

  response.json(await listCustomers(filters));
}

export async function getAdminCustomer(request: Request, response: Response) {
  const parsedParams = customerIdParamSchema.safeParse({ customerId: getRouteParam(request, "customerId") });

  if (!parsedParams.success) {
    sendZodValidationError(response, parsedParams.error, "Customer id is not valid.");
    return;
  }

  const customer = await getCustomerDetail(parsedParams.data.customerId);

  if (!customer) {
    throw createApiError({
      status: 404,
      category: "validation",
      code: "customer_not_found",
      message: "Customer not found",
    });
    return;
  }

  response.json({ customer });
}
