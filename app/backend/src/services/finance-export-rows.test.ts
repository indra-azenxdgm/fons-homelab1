import test from "node:test";
import assert from "node:assert/strict";

import {
  flattenExpenseExportRows,
  flattenIncomeExportRows,
} from "./finance-export-rows";

test("flattenIncomeExportRows expands one export row per income item", () => {
  const rows = flattenIncomeExportRows([
    {
      customerName: "Rina",
      bookingCode: "BK-001",
      transactionDate: new Date("2026-03-28T00:00:00.000Z"),
      billNumber: "INV-01",
      paymentMethod: "Cash",
      items: [
        { id: "1", description: "AC 2 unit", amount: 20000 },
        { id: "2", description: "Udud", amount: 5000 },
      ],
    },
  ]);

  assert.deepEqual(rows, [
    {
      customerName: "Rina",
      bookingReference: "BK-001",
      transactionDate: new Date("2026-03-28T00:00:00.000Z"),
      billNumber: "INV-01",
      price: 20000,
      serviceDescription: "AC 2 unit",
      paymentMethod: "Cash",
    },
    {
      customerName: "Rina",
      bookingReference: "BK-001",
      transactionDate: new Date("2026-03-28T00:00:00.000Z"),
      billNumber: "INV-01",
      price: 5000,
      serviceDescription: "Udud",
      paymentMethod: "Cash",
    },
  ]);
});

test("flattenExpenseExportRows expands one export row per expense item", () => {
  const rows = flattenExpenseExportRows([
    {
      transactionDate: new Date("2026-03-28T00:00:00.000Z"),
      billCode: "OPS-01",
      expenseType: "Supplies +1 more",
      category: "Operational",
      paymentMethod: "Bank Transfer",
      notes: "Office run",
      items: [
        { id: "1", description: "Tissue", amount: 10000 },
        { id: "2", description: "Soap", amount: 15000 },
      ],
    },
  ]);

  assert.deepEqual(rows, [
    {
      transactionDate: new Date("2026-03-28T00:00:00.000Z"),
      billCode: "OPS-01",
      expenseItem: "Tissue",
      category: "Operational",
      amount: 10000,
      paymentMethod: "Bank Transfer",
      notes: "Office run",
    },
    {
      transactionDate: new Date("2026-03-28T00:00:00.000Z"),
      billCode: "OPS-01",
      expenseItem: "Soap",
      category: "Operational",
      amount: 15000,
      paymentMethod: "Bank Transfer",
      notes: "Office run",
    },
  ]);
});
