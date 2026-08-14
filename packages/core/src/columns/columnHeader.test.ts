import { describe, expect, it, vi } from "vitest";

import type { ColumnDef } from "../types";
import {
  columnHeaderController,
  columnHeaderLabel,
  columnsHaveFooter,
  resolveColumnFooter,
  resolveColumnHeader,
} from "./columnHeader";

interface Row {
  id: string;
}

const name: ColumnDef<Row> = { key: "fullName", header: "Name" };
const bare: ColumnDef<Row> = { key: "hiredAt" };

describe("columnHeaderLabel", () => {
  it("prefers an explicit header, then humanizes the key", () => {
    expect(columnHeaderLabel(name)).toBe("Name");
    expect(columnHeaderLabel(bare)).toBe("Hired At");
  });
});

describe("columnHeaderController", () => {
  it("defaults toggleSort to a no-op", () => {
    const controller = columnHeaderController(name);
    expect(() => controller.toggleSort()).not.toThrow();
  });
});

describe("resolveColumnHeader", () => {
  it("returns the default label when no renderer is set", () => {
    const controller = columnHeaderController(name, { sortDir: "asc" });
    expect(resolveColumnHeader(name, controller)).toBe("Name");
  });

  it("hands the controller to a custom renderer", () => {
    const toggleSort = vi.fn();
    const column: ColumnDef<Row> = {
      key: "fullName",
      header: "Name",
      renderHeader: ({ controller }) => {
        const { label } = controller;
        if (typeof label !== "string") {
          throw new Error("expected a string header caption");
        }
        return `${label}:${controller.sortDir ?? "none"}`;
      },
    };
    const controller = columnHeaderController(column, {
      sortDir: "desc",
      sortIndex: 2,
      toggleSort,
    });
    expect(resolveColumnHeader(column, controller)).toBe("Name:desc");
    expect(controller.sortIndex).toBe(2);
    controller.toggleSort({ shiftKey: true });
    expect(toggleSort).toHaveBeenCalledWith({ shiftKey: true });
  });
});

describe("resolveColumnFooter", () => {
  it("returns the summary value, or a custom cell", () => {
    expect(resolveColumnFooter(name, "12")).toBe("12");
    const column: ColumnDef<Row> = {
      key: "fullName",
      renderFooter: ({ value }) => {
        if (typeof value !== "number") {
          throw new Error("expected a numeric summary");
        }
        return `total ${value}`;
      },
    };
    expect(resolveColumnFooter(column, 3)).toBe("total 3");
  });
});

describe("columnsHaveFooter", () => {
  it("is true only when a column declared renderFooter", () => {
    expect(columnsHaveFooter([name, bare])).toBe(false);
    expect(
      columnsHaveFooter([
        name,
        { key: "n", renderFooter: () => "x" } satisfies ColumnDef<Row>,
      ])
    ).toBe(true);
  });
});
