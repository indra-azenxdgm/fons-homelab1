export type ExportFormat = "xlsx" | "csv" | "pdf";

export type ExportModuleKey =
  | "default"
  | "finance.income"
  | "finance.expenses"
  | "bookings.list"
  | "calendar.schedule"
  | "users.list";

export type ExportHeaderVariant = "compact" | "standard" | "detailed";
export type ExportTitleVariant = "standard" | "emphasized" | "compact";
export type ExportTableDensity = "compact" | "standard" | "relaxed";
export type ExportOrientation = "portrait" | "landscape";
export type ExportPaperSize = "A4";

export type ExportPreset = {
  presetId: string;
  moduleKey: ExportModuleKey;
  format: ExportFormat | "shared";
  showLogo: boolean;
  showTagline: boolean;
  showCompanyContact: boolean;
  showDivider: boolean;
  showGeneratedAt: boolean;
  showPreparedBy: boolean;
  showPageNumber: boolean;
  showConfidentialityNote: boolean;
  confidentialityDefaultText: string | null;
  headerVariant: ExportHeaderVariant;
  titleVariant: ExportTitleVariant;
  tableDensity: ExportTableDensity;
  includeSummaryBlock: boolean;
  includeFilterSummary: boolean;
  includeDateRangeSummary: boolean;
  pageOrientation: ExportOrientation;
  paperSize: ExportPaperSize;
  headerSpacingScale: number;
  footerSpacingScale: number;
  filenamePattern: string;
  worksheetHeaderDepth: number;
  printTopRowsEnabled: boolean;
  freezeHeaderEnabled: boolean;
};

const basePreset: ExportPreset = {
  presetId: "base.shared",
  moduleKey: "default",
  format: "shared",
  showLogo: true,
  showTagline: true,
  showCompanyContact: true,
  showDivider: true,
  showGeneratedAt: true,
  showPreparedBy: true,
  showPageNumber: true,
  showConfidentialityNote: false,
  confidentialityDefaultText: null,
  headerVariant: "standard",
  titleVariant: "standard",
  tableDensity: "standard",
  includeSummaryBlock: false,
  includeFilterSummary: true,
  includeDateRangeSummary: true,
  pageOrientation: "portrait",
  paperSize: "A4",
  headerSpacingScale: 1,
  footerSpacingScale: 1,
  filenamePattern: "{module}-export-{date}",
  worksheetHeaderDepth: 8,
  printTopRowsEnabled: false,
  freezeHeaderEnabled: true,
};

const formatPresets: Record<ExportFormat, Partial<ExportPreset>> = {
  csv: {
    showLogo: false,
    showTagline: false,
    showCompanyContact: false,
    showDivider: false,
    showGeneratedAt: false,
    showPreparedBy: false,
    showPageNumber: false,
    showConfidentialityNote: false,
    includeSummaryBlock: false,
    freezeHeaderEnabled: false,
    printTopRowsEnabled: false,
  },
  xlsx: {
    headerVariant: "standard",
    titleVariant: "standard",
    tableDensity: "standard",
    freezeHeaderEnabled: true,
    printTopRowsEnabled: true,
  },
  pdf: {
    headerVariant: "standard",
    titleVariant: "emphasized",
    tableDensity: "compact",
    showPageNumber: true,
  },
};

const moduleSharedPresets: Partial<Record<ExportModuleKey, Partial<ExportPreset>>> = {
  "finance.income": {
    includeSummaryBlock: true,
    includeFilterSummary: true,
    includeDateRangeSummary: true,
    titleVariant: "emphasized",
    filenamePattern: "income-export-{date}",
  },
  "finance.expenses": {
    includeSummaryBlock: true,
    includeFilterSummary: true,
    includeDateRangeSummary: true,
    titleVariant: "emphasized",
    filenamePattern: "expenses-export-{date}",
  },
  "bookings.list": {
    headerVariant: "standard",
    tableDensity: "compact",
    filenamePattern: "bookings-{date}",
  },
  "calendar.schedule": {
    headerVariant: "compact",
    showTagline: false,
    includeSummaryBlock: false,
    filenamePattern: "calendar-{date}",
  },
  "users.list": {
    headerVariant: "compact",
    showTagline: false,
    includeSummaryBlock: false,
    filenamePattern: "users-export-{date}",
  },
};

const moduleFormatPresets: Partial<Record<ExportModuleKey, Partial<Record<ExportFormat, Partial<ExportPreset>>>>> = {
  "finance.income": {
    xlsx: {
      pageOrientation: "landscape",
      tableDensity: "standard",
      worksheetHeaderDepth: 11,
      freezeHeaderEnabled: true,
      printTopRowsEnabled: true,
    },
    pdf: {
      pageOrientation: "landscape",
      tableDensity: "compact",
      footerSpacingScale: 1,
    },
  },
  "finance.expenses": {
    xlsx: {
      pageOrientation: "landscape",
      tableDensity: "standard",
      worksheetHeaderDepth: 11,
      freezeHeaderEnabled: true,
      printTopRowsEnabled: true,
    },
    pdf: {
      pageOrientation: "landscape",
      tableDensity: "compact",
      footerSpacingScale: 1,
    },
  },
};

export function mergeExportPreset(base: ExportPreset, ...overrides: Array<Partial<ExportPreset> | undefined>) {
  return overrides.reduce<ExportPreset>((current, override) => {
    if (!override) {
      return current;
    }

    return {
      ...current,
      ...override,
    };
  }, base);
}

export function resolveExportPreset(input: {
  module: ExportModuleKey;
  format: ExportFormat;
  overrides?: Partial<ExportPreset>;
}) {
  return mergeExportPreset(
    basePreset,
    formatPresets[input.format],
    moduleSharedPresets[input.module],
    moduleFormatPresets[input.module]?.[input.format],
    {
      moduleKey: input.module,
      format: input.format,
      presetId: `${input.module}.${input.format}`,
    },
    input.overrides,
  );
}

export function buildExportFilename(input: {
  preset: ExportPreset;
  moduleSlug: string;
  format: ExportFormat;
  date?: Date;
}) {
  const date = input.date ?? new Date();
  const dateLabel = date.toISOString().slice(0, 10);
  const pattern = input.preset.filenamePattern || "{module}-export-{date}";

  return `${pattern
    .replaceAll("{module}", input.moduleSlug)
    .replaceAll("{date}", dateLabel)
    .replaceAll("{format}", input.format)}.${input.format}`;
}
