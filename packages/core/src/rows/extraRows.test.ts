import { describe, expect, it } from "vitest";

import {
  extraRowsArmed,
  extraRowsForSection,
  insertExtraRows,
  insertExtrasBeforeRows,
  isExtraEntry,
  type ExtraRow,
} from "./extraRows";

const ROWS = [
  { kind: "row" as const, key: "a" },
  { kind: "row" as const, key: "b" },
  { kind: "row" as const, key: "c" },
];
const id = (entry: { key: string }) => entry.key;

describe("extraRowsArmed", () => {
  it("is off until the host passes a slot", () => {
    expect(extraRowsArmed(undefined)).toBe(false);
    expect(extraRowsArmed([])).toBe(false);
    expect(extraRowsArmed([{ key: "s", kind: "separator" }])).toBe(true);
  });
});

describe("isExtraEntry", () => {
  it("narrows only separator and full-width slots", () => {
    expect(isExtraEntry({ kind: "separator", key: "s" })).toBe(true);
    expect(isExtraEntry({ kind: "fullWidth", key: "n" })).toBe(true);
    expect(isExtraEntry({ key: "a" })).toBe(false);
    expect(isExtraEntry({ kind: "row", key: "a" })).toBe(false);
  });
});

describe("insertExtraRows", () => {
  it("is the original list when nothing is injected", () => {
    expect(insertExtraRows(ROWS, undefined, id)).toEqual(ROWS);
    expect(insertExtraRows(ROWS, [], id)).toEqual(ROWS);
  });

  it("inserts a separator before the named row", () => {
    const next = insertExtraRows(
      ROWS,
      [{ key: "s", kind: "separator", beforeRowId: "b" }],
      id
    );
    expect(next.map((entry) => entry.key)).toEqual(["a", "s", "b", "c"]);
    expect(next[1]).toEqual({ kind: "separator", key: "s" });
  });

  it("appends when beforeRowId is omitted", () => {
    const next = insertExtraRows(
      ROWS,
      [{ key: "note", kind: "fullWidth", render: () => "hi" }],
      id
    );
    expect(next.map((entry) => entry.key)).toEqual(["a", "b", "c", "note"]);
    expect(next[3]).toMatchObject({ kind: "fullWidth", key: "note" });
  });

  it("keeps host order for extras that share a target", () => {
    const next = insertExtraRows(
      ROWS,
      [
        { key: "s1", kind: "separator", beforeRowId: "a" },
        { key: "s2", kind: "separator", beforeRowId: "a" },
      ],
      id
    );
    expect(next.map((entry) => entry.key)).toEqual(["s1", "s2", "a", "b", "c"]);
  });

  it("skips group headers as splice targets", () => {
    const grouped = [
      { kind: "group" as const, key: "g" },
      { kind: "row" as const, key: "a" },
    ];
    const next = insertExtraRows(
      grouped,
      [{ key: "s", kind: "separator", beforeRowId: "a" }],
      (entry) => (entry.kind === "row" ? entry.key : undefined)
    );
    expect(next.map((entry) => entry.key)).toEqual(["g", "s", "a"]);
  });
});

describe("extraRowsForSection", () => {
  const extras: ExtraRow[] = [
    { key: "s", kind: "separator", beforeRowId: "a" },
    { key: "n", kind: "fullWidth", render: () => "note" },
  ];

  it("keeps extras aimed at a row in this section", () => {
    expect(
      extraRowsForSection(extras, new Set(["a"]))?.map((e) => e.key)
    ).toEqual(["s"]);
  });

  it("drops extras aimed at a row in another section", () => {
    expect(extraRowsForSection(extras, new Set(["b"]))).toBeUndefined();
  });

  it("appends untargeted extras only when asked", () => {
    expect(
      extraRowsForSection(extras, new Set(["b"]), true)?.map((e) => e.key)
    ).toEqual(["n"]);
  });
});

describe("insertExtrasBeforeRows", () => {
  it("places a named extra in front of that row", () => {
    const next = insertExtrasBeforeRows(
      [{ id: "a" }, { id: "b" }],
      [{ key: "s", kind: "separator", beforeRowId: "b" }],
      (row) => row.id
    );
    expect(next.map((entry) => entry.key)).toEqual(["a", "s", "b"]);
  });

  it("omits untargeted extras from a pin list", () => {
    const next = insertExtrasBeforeRows(
      [{ id: "a" }],
      [
        { key: "s", kind: "separator", beforeRowId: "a" },
        { key: "n", kind: "fullWidth", render: () => "note" },
      ],
      (row) => row.id
    );
    expect(next.map((entry) => entry.key)).toEqual(["s", "a"]);
  });
});
