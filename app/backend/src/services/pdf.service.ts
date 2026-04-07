import { readFile } from "node:fs/promises";
import path from "node:path";

import { backendEnv } from "@/config/env";
import { logger } from "@/lib/logger";

export class PdfServiceError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "PdfServiceError";
    this.status = status;
  }
}

type ConvertHtmlToPdfInput = {
  html: string;
  outputFilename: string;
  footerHtml?: string | null;
  headerHtml?: string | null;
  landscape?: boolean;
  paperWidth?: string;
  paperHeight?: string;
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
};

function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear() {
      clearTimeout(timeout);
    },
  };
}

async function appendHtmlFile(formData: FormData, name: string, content: string) {
  formData.append("files", new File([content], name, { type: "text/html" }));
}

export async function convertHtmlToPdfWithProvider(input: ConvertHtmlToPdfInput) {
  if (backendEnv.pdfProvider !== "gotenberg") {
    throw new PdfServiceError("PDF provider is not configured for HTML conversion", 500);
  }

  const formData = new FormData();
  await appendHtmlFile(formData, "index.html", input.html);

  if (input.headerHtml) {
    await appendHtmlFile(formData, "header.html", input.headerHtml);
  }

  if (input.footerHtml) {
    await appendHtmlFile(formData, "footer.html", input.footerHtml);
  }

  formData.set("landscape", input.landscape ? "true" : "false");
  formData.set("paperWidth", input.paperWidth || "8.27");
  formData.set("paperHeight", input.paperHeight || "11.7");
  formData.set("marginTop", input.marginTop || "0.7");
  formData.set("marginBottom", input.marginBottom || "0.55");
  formData.set("marginLeft", input.marginLeft || "0.4");
  formData.set("marginRight", input.marginRight || "0.4");
  formData.set("printBackground", "true");

  const timeout = createTimeoutSignal(backendEnv.pdfRequestTimeoutMs);

  try {
    const response = await fetch(`${backendEnv.gotenbergUrl}/forms/chromium/convert/html`, {
      method: "POST",
      headers: {
        "Gotenberg-Output-Filename": path.basename(input.outputFilename, ".pdf"),
      },
      body: formData,
      signal: timeout.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      logger.error("pdf.gotenberg.convert_failed", {
        status: response.status,
        trace: response.headers.get("Gotenberg-Trace") || undefined,
        provider: backendEnv.pdfProvider,
        body: body.slice(0, 500),
      });
      throw new PdfServiceError("PDF generation is temporarily unavailable", 502);
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    if (error instanceof PdfServiceError) {
      throw error;
    }

    logger.error("pdf.gotenberg.unreachable", {
      provider: backendEnv.pdfProvider,
      url: backendEnv.gotenbergUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new PdfServiceError("PDF generation service is unavailable", 502);
  } finally {
    timeout.clear();
  }
}

export async function checkPdfProviderHealth() {
  if (backendEnv.pdfProvider !== "gotenberg") {
    return {
      provider: backendEnv.pdfProvider,
      ok: false,
      message: "Unsupported PDF provider",
    };
  }

  const timeout = createTimeoutSignal(5000);

  try {
    const response = await fetch(`${backendEnv.gotenbergUrl}/health`, {
      method: "GET",
      signal: timeout.signal,
    });

    return {
      provider: backendEnv.pdfProvider,
      ok: response.ok,
      status: response.status,
    };
  } catch (error) {
    return {
      provider: backendEnv.pdfProvider,
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    timeout.clear();
  }
}

export async function loadLogoDataUri(absolutePath: string | null | undefined) {
  if (!absolutePath) {
    return null;
  }

  try {
    const buffer = await readFile(absolutePath);
    const extension = path.extname(absolutePath).toLowerCase();
    const mimeType =
      extension === ".png"
        ? "image/png"
        : extension === ".jpg" || extension === ".jpeg"
          ? "image/jpeg"
          : extension === ".webp"
            ? "image/webp"
            : null;

    if (!mimeType) {
      return null;
    }

    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}
