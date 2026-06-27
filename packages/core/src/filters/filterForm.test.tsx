import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ExtraFilters } from "../types";
import type { FilterDef } from "./filterDefs";
import { filterStateKeys } from "./filterDefs";
import {
  type FilterFormSource,
  listFilterValues,
  scalarFilterText,
  useRangeFilterWidget,
} from "./filterForm";

describe("scalarFilterText", () => {
  it("renders unset values as empty and others as strings", () => {
    expect(scalarFilterText(undefined)).toBe("");
    expect(scalarFilterText("")).toBe("");
    expect(scalarFilterText(42)).toBe("42");
    expect(scalarFilterText("hi")).toBe("hi");
  });
});

describe("listFilterValues", () => {
  it("normalizes to a fresh string list, tolerating scalars", () => {
    expect(listFilterValues(undefined)).toEqual([]);
    expect(listFilterValues("")).toEqual([]);
    expect(listFilterValues("a")).toEqual(["a"]);
    expect(listFilterValues(3)).toEqual(["3"]);
    const arr = ["a", "b"];
    const out = listFilterValues(arr);
    expect(out).toEqual(["a", "b"]);
    expect(out).not.toBe(arr);
  });
});

describe("useRangeFilterWidget", () => {
  interface Row {
    budget: number;
  }
  const def: FilterDef<Row> = {
    key: "budget",
    type: "numberRange",
    label: "Budget",
  };
  const [lowKey, highKey] = filterStateKeys(def);

  function makeSource(extra: ExtraFilters) {
    const setExtras = vi.fn();
    const source: FilterFormSource<Row> = {
      extra,
      setExtra: vi.fn(),
      setExtras,
    };
    return { source, setExtras };
  }

  it("exposes label, flavour, and operator label keys", () => {
    const { result } = renderHook(() =>
      useRangeFilterWidget(def, makeSource({}).source)
    );
    expect(result.current.label).toBe("Budget");
    expect(result.current.inputType).toBe("number");
    expect(result.current.opLabelKeys.eq).toBe("opEqual");
    expect(result.current.op).toBeUndefined();
  });

  it("uses date flavour for dateRange", () => {
    const dateDef: FilterDef<Row> = {
      key: "due",
      type: "dateRange",
      label: "Due",
    };
    const { result } = renderHook(() =>
      useRangeFilterWidget(dateDef, makeSource({}).source)
    );
    expect(result.current.inputType).toBe("date");
    expect(result.current.opLabelKeys.eq).toBe("opOn");
  });

  it("seeds gte from a lower bound only", () => {
    const { result } = renderHook(() =>
      useRangeFilterWidget(def, makeSource({ [lowKey!]: "10" }).source)
    );
    expect(result.current.op).toBe("gte");
    expect(result.current.a).toBe("10");
    expect(result.current.b).toBe("");
  });

  it("seeds lte from an upper bound only, reading the high key for `a`", () => {
    const { result } = renderHook(() =>
      useRangeFilterWidget(def, makeSource({ [highKey!]: "20" }).source)
    );
    expect(result.current.op).toBe("lte");
    expect(result.current.a).toBe("20");
  });

  it("seeds between from both bounds", () => {
    const { result } = renderHook(() =>
      useRangeFilterWidget(
        def,
        makeSource({ [lowKey!]: "5", [highKey!]: "9" }).source
      )
    );
    expect(result.current.op).toBe("between");
    expect(result.current.a).toBe("5");
    expect(result.current.b).toBe("9");
  });

  it("writes an operator + bounds back to the persisted pair", () => {
    const { source, setExtras } = makeSource({});
    const { result } = renderHook(() => useRangeFilterWidget(def, source));
    act(() => result.current.write("between", "5", "9"));
    expect(setExtras).toHaveBeenCalledWith({ [lowKey!]: "5", [highKey!]: "9" });
  });

  it("lets the operator be changed as UI state", () => {
    const { result } = renderHook(() =>
      useRangeFilterWidget(def, makeSource({}).source)
    );
    act(() => result.current.setOp("eq"));
    expect(result.current.op).toBe("eq");
  });
});
