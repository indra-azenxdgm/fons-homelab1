import type { Request, Response } from "express";

import { mapKnownError, sendApiError, sendZodValidationError } from "@/controllers/controller-helpers";
import { getAuthenticatedAdmin } from "@/middleware/auth";
import { wipeOperationalData } from "@/services/operational-data.service";
import { getCompanyProfile, upsertCompanyProfile } from "@/services/settings.service";
import { companyProfileUpsertSchema, operationalDataWipeSchema } from "@/validation/api-schemas";

export async function getAdminCompanyProfile(_request: Request, response: Response) {
  response.json({ profile: await getCompanyProfile() });
}

export async function patchAdminCompanyProfile(request: Request, response: Response) {
  const parsedBody = companyProfileUpsertSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "Company profile details are not valid.");
    return;
  }

  response.json({
    success: true,
    profile: await upsertCompanyProfile(parsedBody.data),
  });
}

export async function postAdminOperationalDataWipe(request: Request, response: Response) {
  const parsedBody = operationalDataWipeSchema.safeParse(request.body);

  if (!parsedBody.success) {
    sendZodValidationError(response, parsedBody.error, "Operational data wipe request is not valid.");
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

  try {
    response.json(await wipeOperationalData({
      ...parsedBody.data,
      adminUser,
    }));
  } catch (error) {
    if (!mapKnownError(response, error)) {
      throw error;
    }
  }
}
