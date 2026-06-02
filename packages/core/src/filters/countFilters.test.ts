import { describe, expect, it } from "vitest";

import {
  clearCountFilterExtra,
  countFilterChipLabel,
  countFilterExtra,
  type CountFilterState,
  isCountFilterComplete,
  sanitizeCountFilterParams,
} from "./countFilters";

describe("count filter helpers", () => {
  it("detects complete unary and between filters", () => {
    expect(isCountFilterComplete({ op: "gte", value: 2 })).toBe(true);
    expect(isCountFilterComplete({ op: "gte" })).toBe(false);
    expect(isCountFilterComplete({ op: "between", from: 1, to: 3 })).toBe(true);
    expect(isCountFilterComplete({ op: "between", from: 1 })).toBe(false);
  });

  it("builds URL extra updates for a bucket", () => {
    expect(countFilterExtra("projects", { op: "lt", value: 5 })).toEqual({
      projectsOp: "lt",
      projectsValue: 5,
      projectsFrom: undefined,
      projectsTo: undefined,
    });
    expect(
      countFilterExtra("projects", { op: "between", from: 2, to: 8 })
    ).toEqual({
      projectsOp: "between",
      projectsValue: undefined,
      projectsFrom: 2,
      projectsTo: 8,
    });
  });

  it("builds clear updates for a bucket", () => {
    expect(clearCountFilterExtra("skills")).toEqual({
      skillsOp: undefined,
      skillsValue: undefined,
      skillsFrom: undefined,
      skillsTo: undefined,
    });
  });

  it("sanitizes incomplete filters out of backend params", () => {
    const params = {
      page: 1,
      projectsOp: "gte",
      projectsValue: undefined,
      resourcesOp: "between",
      resourcesFrom: 2,
      resourcesTo: 6,
    };
    expect(
      sanitizeCountFilterParams(params, ["projects", "resources"])
    ).toEqual({
      page: 1,
      resourcesOp: "between",
      resourcesFrom: 2,
      resourcesTo: 6,
    });
  });

  it("formats chip labels for complete filters", () => {
    expect(countFilterChipLabel("Projects", { op: "gte", value: 4 })).toBe(
      "Projects ≥ 4"
    );
    expect(
      countFilterChipLabel("Projects", { op: "between", from: 1, to: 3 })
    ).toBe("Projects: 1-3");
    expect(countFilterChipLabel("Projects", { op: "gte" })).toBeUndefined();
  });

  it("hydrates state from an extra bag", () => {
    const state: CountFilterState = {
      op: "lte",
      value: 10,
    };
    expect(state).toEqual({ op: "lte", value: 10 });
  });
});
