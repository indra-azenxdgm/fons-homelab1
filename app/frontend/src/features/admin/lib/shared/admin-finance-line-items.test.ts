import test from "node:test";
import assert from "node:assert/strict";

import {
  createFinanceLineItem,
  getFinanceLineItemsTotal,
  hasFinanceLineItemErrors,
  normalizeFinanceLineItemsForSubmit,
  parseFinanceLineItemAmount,
  validateFinanceLineItems,
} from "@/features/admin/lib/shared/admin-finance-line-items";

test("createFinanceLineItem returns stable shape", () => {
  const item = createFinanceLineItem();

  assert.ok(item.id.startsWith("item-"));
  assert.equal(item.description, "");
  assert.equal(item.amount, "");
});

test("parseFinanceLineItemAmount normalizes formatted values", () => {
  assert.equal(parseFinanceLineItemAmount("300000"), 300000);
  assert.equal(parseFinanceLineItemAmount("300.000"), 300000);
  assert.equal(parseFinanceLineItemAmount("20,000"), 20000);
  assert.ok(Number.isNaN(parseFinanceLineItemAmount("")));
});

test("validateFinanceLineItems reports per-item errors", () => {
  const result = validateFinanceLineItems([
    { id: "a", description: "Ac", amount: "300000" },
    { id: "b", description: "", amount: "" },
  ]);

  assert.equal(result.items, undefined);
  assert.equal(result.itemFields[0]?.description, undefined);
  assert.equal(result.itemFields[1]?.description, "Description is required.");
  assert.equal(result.itemFields[1]?.amount, "Amount must be greater than 0.");
  assert.equal(
    hasFinanceLineItemErrors({
      items: result.items,
      itemFields: result.itemFields,
    }),
    true,
  );
});

test("normalizeFinanceLineItemsForSubmit keeps all items and trims description", () => {
  const result = normalizeFinanceLineItemsForSubmit([
    { id: "a", description: "  Ac  ", amount: "300000" },
    { id: "b", description: "Clean", amount: "20.000" },
    { id: "c", description: "Extra", amount: "5000" },
  ]);

  assert.deepEqual(result, [
    { description: "Ac", amount: 300000 },
    { description: "Clean", amount: 20000 },
    { description: "Extra", amount: 5000 },
  ]);
});

test("getFinanceLineItemsTotal sums all active items", () => {
  const total = getFinanceLineItemsTotal([
    { id: "a", description: "Ac", amount: "300000" },
    { id: "b", description: "Clean", amount: "20.000" },
    { id: "c", description: "Extra", amount: "5000" },
  ]);

  assert.equal(total, 325000);
});
