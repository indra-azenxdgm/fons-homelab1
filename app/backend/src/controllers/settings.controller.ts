import type { Request, Response } from "express";

import { sendZodValidationError } from "@/controllers/controller-helpers";
import { getCompanyProfile, upsertCompanyProfile } from "@/services/settings.service";
import { companyProfileUpsertSchema } from "@/validation/api-schemas";

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
