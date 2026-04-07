import { existsSync } from "node:fs";
import path from "node:path";

import type { WorkBook, WorkSheet } from "xlsx";

import type { ExportPreset } from "@/services/export-preset.service";
import { getCompanyProfileForExport } from "@/services/settings.service";

const fallbackExportCompanyName = "Fon's Admin";

export type ExportBrandingProfile = {
  companyName: string;
  companyTagline: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  contactLine: string | null;
  fullAddressLine: string | null;
  displayName: string;
  hasLogo: boolean;
};

export type ExportPreparedByInput = {
  name?: string | null;
  email?: string | null;
};

export type ExportMetadataConfig = {
  generatedAtLabel: string;
  preparedByLabel: string;
  generatedAt: Date;
  generatedAtDisplay: string;
  preparedBy: string | null;
  confidentialityNote: string | null;
  pageNumberEnabled: boolean;
  reportContext: string | null;
  timezone: string;
};

export type ExportHeaderTokens = {
  topPaddingRows: number;
  logoColumnSpan: number;
  logoMaxWidthPx: number;
  logoMaxHeightPx: number;
  identityRowHeights: number[];
  titleRowHeight: number;
  metadataRowHeights: number[];
  dividerRowHeight: number;
  spacerRowHeight: number;
  dividerText: string;
};

export type ExportHeaderDescriptor = {
  branding: ExportBrandingProfile;
  companyLines: string[];
  reportTitle: string;
  metadataLines: string[];
  dividerText: string;
  tokens: ExportHeaderTokens;
  metadata: ExportMetadataConfig;
  preset: ExportPreset;
};

type BrandedSheetInput = {
  reportTitle: string;
  reportSubtitle?: string | null;
  tableHeaders: string[];
  rows: Array<Array<string | number>>;
  metadata: ExportMetadataConfig;
  preset: ExportPreset;
  summaryLines?: string[];
};

export const exportMetadataDefaults = {
  generatedAtLabel: "Generated at",
  preparedByLabel: "Prepared by",
  confidentialityNote: null as string | null,
  pageNumberEnabled: true,
  timezone: "Asia/Jakarta",
};

const exportHeaderTokens: ExportHeaderTokens = {
  topPaddingRows: 1,
  logoColumnSpan: 2,
  logoMaxWidthPx: 84,
  logoMaxHeightPx: 44,
  identityRowHeights: [24, 20, 18, 18],
  titleRowHeight: 24,
  metadataRowHeights: [18, 18],
  dividerRowHeight: 10,
  spacerRowHeight: 8,
  dividerText: "________________________________________________________________________________",
};

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function normalizeExportText(value: string | number | null | undefined, maxLength = 240) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}...` : normalized;
}

export function formatGeneratedAtForExport(value: Date, timeZone = exportMetadataDefaults.timezone) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(value);
}

export function resolvePreparedByForExport(preparedBy?: ExportPreparedByInput | null) {
  return normalizeOptionalText(preparedBy?.name) || null;
}

export function buildExportMetadata(input: {
  preparedBy?: ExportPreparedByInput | null;
  confidentialityNote?: string | null;
  reportContext?: string | null;
  generatedAt?: Date;
  timezone?: string;
  pageNumberEnabled?: boolean;
  preset?: Pick<ExportPreset, "showGeneratedAt" | "showPreparedBy" | "showPageNumber" | "showConfidentialityNote" | "confidentialityDefaultText">;
}) : ExportMetadataConfig {
  const generatedAt = input.generatedAt ?? new Date();
  const timezone = input.timezone ?? exportMetadataDefaults.timezone;
  const preset = input.preset;

  return {
    generatedAtLabel: exportMetadataDefaults.generatedAtLabel,
    preparedByLabel: exportMetadataDefaults.preparedByLabel,
    generatedAt,
    generatedAtDisplay: formatGeneratedAtForExport(generatedAt, timezone),
    preparedBy: preset?.showPreparedBy === false ? null : resolvePreparedByForExport(input.preparedBy),
    confidentialityNote:
      preset?.showConfidentialityNote === false
        ? null
        : normalizeOptionalText(input.confidentialityNote ?? preset?.confidentialityDefaultText ?? exportMetadataDefaults.confidentialityNote),
    pageNumberEnabled: preset?.showPageNumber ?? input.pageNumberEnabled ?? exportMetadataDefaults.pageNumberEnabled,
    reportContext: normalizeOptionalText(input.reportContext),
    timezone,
  };
}

export function buildExportFooterConfig(metadata: ExportMetadataConfig) {
  return {
    confidentialityNote: metadata.confidentialityNote,
    pageNumberEnabled: metadata.pageNumberEnabled,
    pageNumberFormat: "Page {current} of {total}",
  };
}

export function buildCompanyContactLine(profile: {
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}) {
  return [
    normalizeOptionalText(profile.phone),
    normalizeOptionalText(profile.email),
    normalizeOptionalText(profile.website),
  ].filter(Boolean).join(" | ") || null;
}

export function buildCompanyAddressLine(profile: {
  address?: string | null;
}) {
  return normalizeOptionalText(profile.address);
}

export function buildCompanyHeaderLines(profile: {
  companyName: string;
  companyTagline?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}) {
  return [
    normalizeOptionalText(profile.companyName) || fallbackExportCompanyName,
    normalizeOptionalText(profile.companyTagline),
    buildCompanyAddressLine(profile),
    buildCompanyContactLine(profile),
  ].filter((line): line is string => Boolean(line));
}

export async function buildExportBranding(): Promise<ExportBrandingProfile> {
  const profile = await getCompanyProfileForExport();
  const companyName = normalizeOptionalText(profile.companyName) || fallbackExportCompanyName;
  const companyTagline = normalizeOptionalText(profile.companyTagline);
  const address = buildCompanyAddressLine(profile);
  const contactLine = buildCompanyContactLine(profile);
  const website = normalizeOptionalText(profile.website);
  const logoUrl = normalizeOptionalText(profile.logoUrl);

  return {
    companyName,
    companyTagline,
    address,
    phone: normalizeOptionalText(profile.phone),
    email: normalizeOptionalText(profile.email),
    website,
    logoUrl,
    contactLine,
    fullAddressLine: address,
    displayName: companyTagline ? `${companyName} - ${companyTagline}` : companyName,
    hasLogo: Boolean(logoUrl),
  };
}

export function buildExportHeaderDescriptor(input: {
  branding: ExportBrandingProfile;
  reportTitle: string;
  reportSubtitle?: string | null;
  metadata: ExportMetadataConfig;
  preset: ExportPreset;
}) : ExportHeaderDescriptor {
  const metadataLines = [
    input.preset.showGeneratedAt ? `${input.metadata.generatedAtLabel}: ${input.metadata.generatedAtDisplay}` : null,
    input.metadata.preparedBy ? `${input.metadata.preparedByLabel}: ${input.metadata.preparedBy}` : null,
    input.preset.includeFilterSummary ? normalizeOptionalText(input.reportSubtitle) : null,
    input.preset.includeDateRangeSummary ? input.metadata.reportContext : null,
  ].map((line) => (line ? normalizeExportText(line, 180) : null)).filter((line): line is string => Boolean(line));

  const companyLines = [
    input.branding.companyName,
    input.preset.showTagline ? input.branding.companyTagline : null,
    input.branding.address,
    input.preset.showCompanyContact ? input.branding.contactLine : null,
  ].map((line) => (line ? normalizeExportText(line, 180) : null)).filter((line): line is string => Boolean(normalizeOptionalText(line)));

  return {
    branding: input.branding,
    companyLines,
    reportTitle: input.reportTitle,
    metadataLines,
    dividerText: input.preset.showDivider ? exportHeaderTokens.dividerText : "",
    tokens: {
      ...exportHeaderTokens,
      identityRowHeights:
        input.preset.headerVariant === "compact"
          ? [22, 18, 16, 16]
          : input.preset.headerVariant === "detailed"
            ? [26, 21, 19, 19]
            : exportHeaderTokens.identityRowHeights,
      titleRowHeight:
        input.preset.titleVariant === "emphasized"
          ? 26
          : input.preset.titleVariant === "compact"
            ? 21
            : exportHeaderTokens.titleRowHeight,
      metadataRowHeights:
        input.preset.headerVariant === "compact"
          ? [16, 16]
          : input.preset.headerVariant === "detailed"
            ? [19, 19]
            : exportHeaderTokens.metadataRowHeights,
      spacerRowHeight: Math.round(exportHeaderTokens.spacerRowHeight * input.preset.headerSpacingScale),
      dividerRowHeight: Math.round(exportHeaderTokens.dividerRowHeight * input.preset.headerSpacingScale),
    },
    metadata: input.metadata,
    preset: input.preset,
  };
}

export function buildPdfExportHeaderModel(input: {
  branding: ExportBrandingProfile;
  reportTitle: string;
  reportSubtitle?: string | null;
  metadata: ExportMetadataConfig;
  preset: ExportPreset;
}) {
  return buildExportHeaderDescriptor(input);
}

export function applyWorkbookBranding(
  workbook: WorkBook,
  branding: ExportBrandingProfile,
  input: {
    title: string;
    subject: string;
    metadata: ExportMetadataConfig;
    preset: ExportPreset;
  },
) {
  workbook.Props = {
    Title: input.title,
    Subject: input.subject,
    Author: input.metadata.preparedBy || branding.companyName,
    Company: branding.companyName,
    Comments: [
      input.metadata.generatedAtLabel ? `${input.metadata.generatedAtLabel}: ${input.metadata.generatedAtDisplay}` : null,
      input.metadata.preparedBy ? `${input.metadata.preparedByLabel}: ${input.metadata.preparedBy}` : null,
      input.metadata.reportContext,
      input.metadata.confidentialityNote,
    ].filter(Boolean).join(" | ") || branding.contactLine || branding.fullAddressLine || undefined,
  };
}

export function buildBrandedWorksheetData(input: BrandedSheetInput, branding: ExportBrandingProfile) {
  // The current SheetJS setup does not support robust portable image embedding and print
  // footer pagination in a way we can rely on across Excel clients, so XLSX exports use a
  // reserved logo zone plus structured text metadata near the header, while the shared
  // footer/page-number model remains available for PDF and future richer spreadsheet tooling.
  const header = buildExportHeaderDescriptor({
    branding,
    reportTitle: input.reportTitle,
    reportSubtitle: input.reportSubtitle,
    metadata: input.metadata,
    preset: input.preset,
  });
  const rows: Array<Array<string | number>> = [];

  rows.push(["", "", "", "", "", "", "", ""]);

  const companyLineRows = Math.max(4, header.companyLines.length || 1);
  for (let index = 0; index < companyLineRows; index += 1) {
    const isFirstRow = index === 0;
    rows.push([
      isFirstRow && branding.hasLogo && input.preset.showLogo ? "" : "",
      "",
      normalizeExportText(header.companyLines[index] || "", 180),
      "",
      "",
      "",
      "",
      "",
    ]);
  }

  rows.push(["", "", "", "", "", "", "", ""]);
  rows.push([header.reportTitle, "", "", "", "", "", "", ""]);

  const metadataLineCount = Math.max(2, header.metadataLines.length || 1);
  for (let index = 0; index < metadataLineCount; index += 1) {
    rows.push([header.metadataLines[index] || "", "", "", "", "", "", "", ""]);
  }

  if (input.summaryLines?.length && input.preset.includeSummaryBlock) {
    input.summaryLines.forEach((line) => {
      rows.push([normalizeExportText(line, 180), "", "", "", "", "", "", ""]);
    });
  }

  if (header.dividerText) {
    rows.push([header.dividerText, "", "", "", "", "", "", ""]);
  }
  rows.push(["", "", "", "", "", "", "", ""]);
  rows.push(input.tableHeaders);
  rows.push(
    ...(input.rows.length > 0
      ? input.rows.map((row) => row.map((cell) => normalizeExportText(cell, 220)))
      : [[
          "No data available for the selected export filters.",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]]),
  );

  const summaryLineCount = input.summaryLines?.length && input.preset.includeSummaryBlock ? input.summaryLines.length : 0;

  return {
    header,
    data: rows,
    tableHeaderRowIndex: companyLineRows + metadataLineCount + summaryLineCount + (header.dividerText ? 5 : 4),
  };
}

export function applyBrandedWorksheetLayout(
  sheet: WorkSheet,
  input: {
    columnCount: number;
    header: ExportHeaderDescriptor;
    tableHeaderRowIndex: number;
  },
) {
  const mergeEndColumn = Math.max(0, input.columnCount - 1);
  const logoEndColumn = Math.max(0, Math.min(input.header.tokens.logoColumnSpan - 1, mergeEndColumn));
  const identityStartColumn = Math.min(logoEndColumn + 1, mergeEndColumn);
  const companyLineRows = Math.max(4, input.header.companyLines.length || 1);
  const metadataLineCount = Math.max(2, input.header.metadataLines.length || 1);
  const summaryLineCount = input.header.preset.includeSummaryBlock ? Math.max(0, input.tableHeaderRowIndex - (companyLineRows + metadataLineCount + (input.header.dividerText ? 5 : 4))) : 0;
  const merges: NonNullable<WorkSheet["!merges"]> = [];

  if (input.header.preset.showLogo) {
    merges.push({
      s: { r: 1, c: 0 },
      e: { r: companyLineRows, c: logoEndColumn },
    });
  }

  for (let index = 0; index < companyLineRows; index += 1) {
    merges.push({
      s: { r: 1 + index, c: input.header.preset.showLogo ? identityStartColumn : 0 },
      e: { r: 1 + index, c: mergeEndColumn },
    });
  }

  merges.push({
    s: { r: companyLineRows + 2, c: 0 },
    e: { r: companyLineRows + 2, c: mergeEndColumn },
  });

  for (let index = 0; index < metadataLineCount; index += 1) {
    merges.push({
      s: { r: companyLineRows + 3 + index, c: 0 },
      e: { r: companyLineRows + 3 + index, c: mergeEndColumn },
    });
  }

  for (let index = 0; index < summaryLineCount; index += 1) {
    merges.push({
      s: { r: companyLineRows + metadataLineCount + 3 + index, c: 0 },
      e: { r: companyLineRows + metadataLineCount + 3 + index, c: mergeEndColumn },
    });
  }

  if (input.header.dividerText) {
    merges.push({
      s: { r: companyLineRows + metadataLineCount + summaryLineCount + 3, c: 0 },
      e: { r: companyLineRows + metadataLineCount + summaryLineCount + 3, c: mergeEndColumn },
    });
  }

  sheet["!merges"] = merges;
  sheet["!rows"] = [
    { hpx: input.header.tokens.spacerRowHeight },
    ...Array.from({ length: companyLineRows }, (_, index) => ({
      hpx: input.header.tokens.identityRowHeights[index] || input.header.tokens.identityRowHeights.at(-1) || 18,
    })),
    { hpx: input.header.tokens.spacerRowHeight },
    { hpx: input.header.tokens.titleRowHeight },
    ...Array.from({ length: metadataLineCount }, (_, index) => ({
      hpx: input.header.tokens.metadataRowHeights[index] || input.header.tokens.metadataRowHeights.at(-1) || 18,
    })),
    ...Array.from({ length: summaryLineCount }, () => ({
      hpx:
        input.header.preset.tableDensity === "compact"
          ? 16
          : input.header.preset.tableDensity === "relaxed"
            ? 21
            : 18,
    })),
    ...(input.header.dividerText ? [{ hpx: input.header.tokens.dividerRowHeight }] : []),
    { hpx: input.header.tokens.spacerRowHeight },
  ];

  const worksheetWithOptions = sheet as WorkSheet & {
    "!autofilter"?: { ref: string };
    "!margins"?: {
      left: number;
      right: number;
      top: number;
      bottom: number;
      header: number;
      footer: number;
    };
    "!pageSetup"?: {
      orientation?: "portrait" | "landscape";
      paperSize?: number;
      fitToWidth?: number;
      fitToHeight?: number;
    };
    "!freeze"?: {
      xSplit: number;
      ySplit: number;
      topLeftCell: string;
      activePane: string;
      state: string;
    };
  };
  const tableHeaderExcelRow = input.tableHeaderRowIndex + 1;
  const finalColumnLetter = String.fromCharCode(64 + Math.min(input.columnCount, 26));
  worksheetWithOptions["!autofilter"] = {
    ref: `A${tableHeaderExcelRow}:${finalColumnLetter}${tableHeaderExcelRow}`,
  };
  worksheetWithOptions["!margins"] = {
    left: 0.35,
    right: 0.35,
    top: 0.5,
    bottom: 0.55,
    header: 0.2,
    footer: 0.25,
  };
  worksheetWithOptions["!pageSetup"] = {
    orientation: input.header.preset.pageOrientation,
    paperSize: 9,
    fitToWidth: 1,
    fitToHeight: 0,
  };
  if (input.header.preset.freezeHeaderEnabled) {
    worksheetWithOptions["!freeze"] = {
      xSplit: 0,
      ySplit: input.tableHeaderRowIndex + 1,
      topLeftCell: `A${input.tableHeaderRowIndex + 2}`,
      activePane: "bottomLeft",
      state: "frozen",
    };
  }
}

export function resolveLogoPathForExport(logoUrl: string | null | undefined) {
  const normalized = normalizeOptionalText(logoUrl);

  if (!normalized || /^https?:\/\//i.test(normalized)) {
    return null;
  }

  if (normalized.toLowerCase().endsWith(".svg")) {
    return null;
  }

  const relativePath = normalized.replace(/^\/+/, "").replaceAll("/", path.sep);
  const candidates = [
    path.join(process.cwd(), "frontend", "public", relativePath),
    path.join(process.cwd(), "public", relativePath),
    path.join(process.cwd(), "..", "frontend", "public", relativePath),
  ];

  return candidates.find((candidate) => existsSync(candidate)) || null;
}
