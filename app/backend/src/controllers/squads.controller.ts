import type { Request, Response } from "express";

import { createApiError, getRouteParam, sendZodValidationError } from "@/controllers/controller-helpers";
import { createSquad, getSquadDetail, getSquadLookup, listSquads } from "@/services/squads.service";
import { squadCreateSchema, squadIdParamSchema, squadListQuerySchema } from "@/validation/api-schemas";

export async function getAdminSquads(request: Request, response: Response) {
  const parsedQuery = squadListQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    sendZodValidationError(response, parsedQuery.error, "Squad filters are not valid.");
    return;
  }

  const filters = Object.fromEntries(
    Object.entries(parsedQuery.data).map(([key, value]) => [key, value == null ? undefined : String(value)]),
  ) as Record<string, string | undefined>;

  response.json(await listSquads(filters));
}

export async function getAdminSquadLookup(_request: Request, response: Response) {
  response.json({ squads: await getSquadLookup() });
}

export async function createAdminSquad(request: Request, response: Response) {
  const parsedBody = squadCreateSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "Squad details are not valid.");
    return;
  }

  const squad = await createSquad(parsedBody.data);
  response.status(201).json({ squad });
}

export async function getAdminSquad(request: Request, response: Response) {
  const parsedParams = squadIdParamSchema.safeParse({ squadId: getRouteParam(request, "squadId") });

  if (!parsedParams.success) {
    sendZodValidationError(response, parsedParams.error, "Squad id is not valid.");
    return;
  }

  const squad = await getSquadDetail(parsedParams.data.squadId);

  if (!squad) {
    throw createApiError({
      status: 404,
      category: "validation",
      code: "squad_not_found",
      message: "Squad not found",
    });
    return;
  }

  response.json({ squad });
}
