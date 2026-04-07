import test from "node:test";
import assert from "node:assert/strict";

import { buildExportFilename, resolveExportPreset } from "@/services/export-preset.service";

test("resolveExportPreset merges finance pdf defaults", () => {
  const preset = resolveExportPreset({
    module: "finance.income",
    format: "pdf",
  });

  assert.equal(preset.moduleKey, "finance.income");
  assert.equal(preset.format, "pdf");
  assert.equal(preset.pageOrientation, "landscape");
  assert.equal(preset.includeSummaryBlock, true);
  assert.equal(preset.showPageNumber, true);
  assert.equal(preset.titleVariant, "emphasized");
});

test("resolveExportPreset falls back for unknown customization gaps", () => {
  const preset = resolveExportPreset({
    module: "bookings.list",
    format: "xlsx",
  });

  assert.equal(preset.showLogo, true);
  assert.equal(preset.tableDensity, "compact");
  assert.equal(preset.freezeHeaderEnabled, true);
});

test("buildExportFilename uses preset pattern", () => {
  const preset = resolveExportPreset({
    module: "finance.expenses",
    format: "pdf",
  });

  const filename = buildExportFilename({
    preset,
    moduleSlug: "expenses",
    format: "pdf",
    date: new Date("2026-03-27T10:00:00.000Z"),
  });

  assert.equal(filename, "expenses-export-2026-03-27.pdf");
});
