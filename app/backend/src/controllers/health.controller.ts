import type { Request, Response } from "express";

import { backendEnv } from "@/config/env";
import { checkPdfProviderHealth } from "@/services/pdf.service";

export async function getHealth(request: Request, response: Response) {
  if (request.query.dependencies === "true" && backendEnv.nodeEnv !== "production") {
    response.json({
      ok: true,
      service: "backend",
      pdfProvider: await checkPdfProviderHealth(),
    });
    return;
  }

  response.json({
    ok: true,
    service: "backend",
    pdfProvider: backendEnv.pdfProvider,
  });
}
