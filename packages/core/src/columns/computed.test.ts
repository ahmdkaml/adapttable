/**
 * Computed columns.
 *
 * The point of declaring a derivation rather than writing it into `accessor`
 * is that the four surfaces stop disagreeing: what you see is formatted, what
 * you sort by is the value, and the cache knows when it is stale.
 */
import { describe, expect, it, vi } from "vitest";

import { sortRows } from "../sort/compare";
import { computed } from "./computed";

interface Order {
  id: string;
  quantity: number;
  unitPrice: number;
  first: string;
  last: string;
}

const ORDERS: Order[] = [
  { id: "a", quantity: 2, unitPrice: 620, first: "Ada", last: "Lovelace" },
  { id: "b", quantity: 1, unitPrice: 90, first: "Alan", last: "Turing" },
];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function totalColumn() {
  return computed<Order, number>({
    key: "total",
    header: "Total",
    deps: (row) => [row.quantity, row.unitPrice],
    value: (row) => row.quantity * row.unitPrice,
    format: (total) => money.format(total),
  });
}

describe("computed columns", () => {
  it("shows the formatted value", () => {
    const column = totalColumn();
    expect(column.accessor?.(ORDERS[0]!)).toBe("$1,240.00");
  });

  it("sorts by the value, not by the formatting", () => {
    const { sortValue } = totalColumn();
    if (!sortValue) throw new Error("a computed column always has a sortValue");
    // Sorted as text, "$1,240.00" would come before "$90.00".
    const sorted = sortRows(ORDERS, sortValue, "asc");
    expect(sorted.map((row) => row.id)).toEqual(["b", "a"]);
  });

  it("exports the value a spreadsheet can use", () => {
    const column = totalColumn();
    expect(column.exportValue?.(ORDERS[0]!)).toBe(1240);
  });

  it("renders a raw value when no formatter is given", () => {
    const column = computed<Order, string>({
      key: "name",
      deps: (row) => [row.first, row.last],
      value: (row) => `${row.first} ${row.last}`,
    });
    expect(column.accessor?.(ORDERS[0]!)).toBe("Ada Lovelace");
  });

  it("computes once per row and reuses the result", () => {
    const value = vi.fn((row: Order) => row.quantity * row.unitPrice);
    const column = computed<Order, number>({
      key: "total",
      deps: (row) => [row.quantity, row.unitPrice],
      value,
    });

    column.accessor?.(ORDERS[0]!);
    column.sortValue?.(ORDERS[0]!);
    column.exportValue?.(ORDERS[0]!);

    // Three surfaces asked; the derivation ran once.
    expect(value).toHaveBeenCalledTimes(1);
  });

  it("recomputes when a declared dependency changes", () => {
    const value = vi.fn((row: Order) => row.quantity * row.unitPrice);
    const column = computed<Order, number>({
      key: "total",
      deps: (row) => [row.quantity, row.unitPrice],
      value,
    });
    const row = { ...ORDERS[0]! };

    expect(column.sortValue?.(row)).toBe(1240);
    row.quantity = 3;
    expect(column.sortValue?.(row)).toBe(1860);
    expect(value).toHaveBeenCalledTimes(2);
  });

  it("keeps the cached value when an undeclared field changes", () => {
    const value = vi.fn((row: Order) => row.quantity * row.unitPrice);
    const column = computed<Order, number>({
      key: "total",
      deps: (row) => [row.quantity, row.unitPrice],
      value,
    });
    const row = { ...ORDERS[0]! };

    column.sortValue?.(row);
    row.first = "Someone else";
    column.sortValue?.(row);

    // The contract is exactly this: deps decide, nothing else does.
    expect(value).toHaveBeenCalledTimes(1);
  });

  it("caches per row, not globally", () => {
    const column = totalColumn();
    expect(column.exportValue?.(ORDERS[0]!)).toBe(1240);
    expect(column.exportValue?.(ORDERS[1]!)).toBe(90);
  });

  it("passes through the rest of a column definition", () => {
    const column = computed<Order, number>({
      key: "total",
      deps: (row) => [row.quantity],
      value: (row) => row.quantity,
      column: { sortable: true, align: "end", width: 120 },
    });
    expect(column.sortable).toBe(true);
    expect(column.align).toBe("end");
    expect(column.width).toBe(120);
  });

  it("renders nothing for a value that is absent", () => {
    const column = computed<Order, string | null>({
      key: "note",
      deps: () => [],
      value: () => null,
    });
    expect(column.accessor?.(ORDERS[0]!)).toBe("");
  });

  it("renders a date as an ISO string when unformatted", () => {
    const when = new Date("2026-08-12T00:00:00.000Z");
    const column = computed<Order, Date>({
      key: "due",
      deps: () => [when],
      value: () => when,
    });
    expect(column.accessor?.(ORDERS[0]!)).toBe("2026-08-12T00:00:00.000Z");
  });
});
