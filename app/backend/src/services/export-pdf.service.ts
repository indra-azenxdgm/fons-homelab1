import {
  buildExportFooterConfig,
  buildPdfExportHeaderModel,
  normalizeExportText,
  resolveLogoPathForExport,
  type ExportBrandingProfile,
  type ExportMetadataConfig,
} from "@/services/export-branding.service";
import type { ExportPreset } from "@/services/export-preset.service";
import { convertHtmlToPdfWithProvider, loadLogoDataUri } from "@/services/pdf.service";

type PdfColumn = {
  key: string;
  label: string;
  width: number;
  align?: "left" | "right" | "center";
};

type PdfRow = Record<string, string>;

type BrandedPdfReportInput = {
  branding: ExportBrandingProfile;
  metadata: ExportMetadataConfig;
  reportTitle: string;
  reportSubtitle?: string | null;
  preset: ExportPreset;
  summaryLines?: string[];
  columns: PdfColumn[];
  rows: PdfRow[];
  outputFilename?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizePdfText(value: string, maxLength = 240) {
  return escapeHtml(normalizeExportText(value, maxLength));
}

function fitColumnsToPage(columns: PdfColumn[], orientation: ExportPreset["pageOrientation"]) {
  const availableWidth = orientation === "landscape" ? 1040 : 720;
  const totalWidth = columns.reduce((total, column) => total + column.width, 0);

  if (totalWidth <= availableWidth) {
    return columns;
  }

  const scale = availableWidth / totalWidth;

  return columns.map((column) => ({
    ...column,
    width: Math.max(column.align === "right" ? 60 : 90, Math.floor(column.width * scale)),
  }));
}

function getDensityClassName(density: ExportPreset["tableDensity"]) {
  if (density === "compact") {
    return "density-compact";
  }

  if (density === "relaxed") {
    return "density-relaxed";
  }

  return "density-standard";
}

function buildFooterHtml(metadata: ExportMetadataConfig) {
  const footer = buildExportFooterConfig(metadata);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        font-family: Arial, Helvetica, sans-serif;
        color: #6b7280;
        font-size: 9px;
      }
      .footer {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #e5e7eb;
        padding-top: 6px;
      }
      .note {
        max-width: 65%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .page {
        text-align: right;
      }
    </style>
  </head>
  <body>
    <div class="footer">
      <div class="note">${footer.confidentialityNote ? escapeHtml(footer.confidentialityNote) : ""}</div>
      <div class="page">${footer.pageNumberEnabled ? 'Page <span class="pageNumber"></span> of <span class="totalPages"></span>' : ""}</div>
    </div>
  </body>
</html>`;
}

export async function renderBrandedPdfTableReport(input: BrandedPdfReportInput) {
  const header = buildPdfExportHeaderModel(input);
  const logoPath = input.preset.showLogo ? resolveLogoPathForExport(input.branding.logoUrl) : null;
  const logoDataUri = await loadLogoDataUri(logoPath);
  const columns = fitColumnsToPage(input.columns, input.preset.pageOrientation);
  const rows =
    input.rows.length > 0
      ? input.rows
      : [{
          [columns[0]?.key || "message"]: "No data available for the selected export filters.",
        }];

  const metadataLines = header.metadataLines
    .map((line) => `<div class="meta-line">${normalizePdfText(line, 220)}</div>`)
    .join("");

  const summaryBlock =
    input.summaryLines?.length && input.preset.includeSummaryBlock
      ? `<div class="summary-block">${input.summaryLines
          .map((line) => `<div class="summary-line">${normalizePdfText(line, 220)}</div>`)
          .join("")}</div>`
      : "";

  const tableHead = columns
    .map((column) => `<th class="align-${column.align || "left"}" style="width:${column.width}px">${escapeHtml(column.label)}</th>`)
    .join("");

  const tableBody = rows
    .map((row) => `<tr>${columns
      .map((column) => `<td class="align-${column.align || "left"}">${normalizePdfText(row[column.key] || "", 320)}</td>`)
      .join("")}</tr>`)
    .join("");

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page {
        size: A4 ${input.preset.pageOrientation};
        margin: 18mm 10mm 18mm 10mm;
      }
      * {
        box-sizing: border-box;
      }
      html, body {
        margin: 0;
        padding: 0;
        font-family: Arial, Helvetica, sans-serif;
        color: #0f172a;
      }
      body {
        font-size: 11px;
      }
      .page {
        width: 100%;
      }
      .report-header {
        display: flex;
        gap: 14px;
        align-items: flex-start;
        margin-bottom: ${Math.round(14 * input.preset.headerSpacingScale)}px;
      }
      .logo {
        width: 86px;
        min-width: 86px;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
      }
      .logo img {
        max-width: 84px;
        max-height: 44px;
        object-fit: contain;
      }
      .identity {
        flex: 1;
        min-width: 0;
      }
      .company-name {
        font-size: ${input.preset.titleVariant === "emphasized" ? 20 : input.preset.titleVariant === "compact" ? 17 : 18}px;
        font-weight: 700;
        line-height: 1.2;
        margin: 0 0 4px;
        word-break: break-word;
      }
      .company-line {
        margin: 0;
        color: #475569;
        font-size: 10px;
        line-height: 1.5;
        word-break: break-word;
      }
      .report-title {
        font-size: ${input.preset.titleVariant === "emphasized" ? 17 : input.preset.titleVariant === "compact" ? 14 : 15}px;
        font-weight: 700;
        margin: 0;
        line-height: 1.3;
        word-break: break-word;
      }
      .report-meta {
        margin-top: 8px;
      }
      .meta-line,
      .summary-line {
        color: #64748b;
        font-size: 10px;
        line-height: 1.45;
        word-break: break-word;
      }
      .summary-block {
        margin-top: 8px;
      }
      .divider {
        margin-top: 10px;
        border-top: 1px solid #d4d4d8;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        margin-top: ${input.preset.showDivider ? 12 : 8}px;
      }
      thead {
        display: table-header-group;
      }
      tr {
        page-break-inside: avoid;
      }
      th {
        text-align: left;
        font-size: 9px;
        font-weight: 700;
        color: #111827;
        padding: 8px 6px;
        border-top: 1px solid #d4d4d8;
        border-bottom: 1px solid #d4d4d8;
        vertical-align: top;
      }
      td {
        color: #111827;
        border-bottom: 1px solid #e5e7eb;
        vertical-align: top;
        word-break: break-word;
        overflow-wrap: anywhere;
      }
      .density-compact td { padding: 5px 6px; font-size: 9px; line-height: 1.35; }
      .density-standard td { padding: 7px 6px; font-size: 9.5px; line-height: 1.4; }
      .density-relaxed td { padding: 9px 6px; font-size: 10px; line-height: 1.45; }
      .align-right { text-align: right; }
      .align-center { text-align: center; }
      .align-left { text-align: left; }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="report-header">
        ${logoDataUri ? `<div class="logo"><img src="${logoDataUri}" alt="Company logo" /></div>` : ""}
        <div class="identity">
          <h1 class="company-name">${normalizePdfText(header.companyLines[0] || input.branding.companyName, 180)}</h1>
          ${header.companyLines.slice(1).map((line) => `<p class="company-line">${normalizePdfText(line, 220)}</p>`).join("")}
        </div>
      </section>
      <section>
        <h2 class="report-title">${normalizePdfText(header.reportTitle, 180)}</h2>
        <div class="report-meta">${metadataLines}</div>
        ${summaryBlock}
        ${input.preset.showDivider ? '<div class="divider"></div>' : ""}
      </section>
      <table class="${getDensityClassName(input.preset.tableDensity)}">
        <thead>
          <tr>${tableHead}</tr>
        </thead>
        <tbody>
          ${tableBody}
        </tbody>
      </table>
    </main>
  </body>
</html>`;

  return convertHtmlToPdfWithProvider({
    html,
    footerHtml: buildFooterHtml(input.metadata),
    landscape: input.preset.pageOrientation === "landscape",
    outputFilename: input.outputFilename || `${normalizeExportText(input.reportTitle, 80).replace(/\s+/g, "-").toLowerCase()}.pdf`,
  });
}
