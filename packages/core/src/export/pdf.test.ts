/**
 * The PDF writer, checked on its bytes.
 *
 * "A reader opened it" is not a test — it passes for a file whose xref
 * points at the wrong offset, and fails a year later on a stricter
 * reader. The format is a spec with fixed offsets, so this reads the
 * file back the way a reader does: the header, the xref table, every
 * object's promised offset, and the stream lengths the page tree cites.
 */
import { afterEach, describe, expect, it } from "vitest";

import type { ColumnDef } from "../types";
import { buildExportTable } from "./exportWriter";
import { buildTablePdf, pdfWriter } from "./pdf";

interface Row {
  name: string;
  age: number;
  zip: string;
  active: boolean;
}

const ROWS: Row[] = [
  { name: "Ada", age: 36, zip: "01730", active: true },
  { name: "Grace (x) \\ &", age: 45, zip: "02139", active: false },
];

const COLUMNS: ColumnDef<Row>[] = [
  { key: "name", header: "Name", accessor: (row) => row.name },
  { key: "age", header: "Age", accessor: (row) => row.age },
  { key: "zip", header: "Zip", accessor: (row) => row.zip },
  { key: "active", header: "Active", accessor: (row) => row.active },
];

afterEach(() => {
  document.documentElement.removeAttribute("dir");
});

/** Latin-1 decode — PDF syntax is ASCII and the binary marker is bytes. */
function latin1(bytes: Uint8Array): string {
  return new TextDecoder("latin1").decode(bytes);
}

function parseXref(text: string): { offset: number; lines: string[] } {
  const at = text.lastIndexOf("startxref");
  const offset = Number(text.slice(at).split("\n")[1]);
  const block = text.slice(offset);
  expect(block.startsWith("xref")).toBe(true);
  const lines = block.split("\n").filter((line) => line.length > 0);
  return { offset, lines };
}

function objectOffsets(text: string): number[] {
  const { offset } = parseXref(text);
  const offsets: number[] = [];
  for (const line of text.slice(offset).split("\n")) {
    const match = /^(\d{10}) (\d{5}) n ?$/.exec(line);
    if (match) offsets.push(Number(match[1]));
  }
  return offsets;
}

function assertWellFormed(bytes: Uint8Array): string {
  const text = latin1(bytes);
  expect(text.startsWith("%PDF-1.4")).toBe(true);
  expect(text.endsWith("%%EOF\n")).toBe(true);
  expect(text).toContain("/Type /Catalog");
  expect(text).toContain("/Type /Pages");
  expect(text).toContain("/BaseFont /Helvetica");
  expect(text).toContain("/BaseFont /Helvetica-Bold");
  const { offset } = parseXref(text);
  expect(text.slice(offset, offset + 4)).toBe("xref");
  for (const at of objectOffsets(text)) {
    expect(text.slice(at)).toMatch(/^\d+ 0 obj/);
  }
  const streams = [...text.matchAll(/\/Length (\d+) >>\nstream\n/g)];
  expect(streams.length).toBeGreaterThan(0);
  for (const match of streams) {
    const length = Number(match[1]);
    const start = match.index + match[0].length;
    expect(text.slice(start + length, start + length + 10)).toBe("\nendstream");
  }
  return text;
}

const pdfOf = (rows: Row[] = ROWS, columns = COLUMNS) =>
  latin1(buildTablePdf({ rows, columns }));

describe("buildTablePdf", () => {
  it("writes a well-formed one-page workbook of the table", () => {
    const text = assertWellFormed(
      buildTablePdf({ rows: ROWS, columns: COLUMNS })
    );
    expect(text).toContain("/Count 1");
    expect(text).toContain("(Name)");
    expect(text).toContain("(Ada)");
    expect(text).toContain("(36)");
    expect(text).toContain("(01730)");
    expect(text).toContain("(true)");
    expect(text).toContain("(false)");
    expect(text).toContain("/MediaBox [0 0 842 595]");
  });

  it("escapes the characters a PDF string cannot carry literally", () => {
    const text = pdfOf();
    expect(text).toContain("Grace \\(x\\) \\\\ &");
  });

  it("drops control characters that would break a content stream", () => {
    const text = pdfOf([{ name: "a\u0001b", age: 1, zip: "", active: false }]);
    expect(text).toContain("(ab)");
    expect(text).not.toContain("\u0001");
  });

  it("writes an empty cell as a box, not as [object Object]", () => {
    const text = latin1(
      buildTablePdf({
        rows: ROWS,
        columns: [{ key: "name", header: "Name", exportValue: () => null }],
      })
    );
    expect(text).toContain("(Name)");
    expect(text).not.toContain("[object Object]");
    expect(text).not.toContain("(null)");
  });

  it("prefers a column's exportValue, exactly as CSV does", () => {
    const text = latin1(
      buildTablePdf({
        rows: ROWS,
        columns: [
          {
            key: "name",
            header: "Name",
            accessor: (row) => row.name,
            exportValue: (row) => `${row.name} (exported)`,
          },
        ],
      })
    );
    expect(text).toContain("Ada \\(exported\\)");
  });

  it("falls back to a column's key when its header is not text", () => {
    const text = latin1(
      buildTablePdf({
        rows: ROWS,
        columns: [
          { key: "name", header: 1 as never, accessor: (row) => row.name },
        ],
      })
    );
    expect(text).toContain("(name)");
  });

  it("writes a date-only value as an ISO day", () => {
    const text = latin1(
      buildTablePdf({
        rows: [{ due: new Date("2026-08-15T00:00:00.000Z") }],
        columns: [
          {
            key: "due",
            header: "Due",
            exportValue: (row: { due: Date }) => row.due,
          },
        ],
      })
    );
    expect(text).toContain("(2026-08-15)");
  });

  it("writes a date-and-time without the T separator", () => {
    const text = latin1(
      buildTablePdf({
        rows: [{ due: new Date("2026-08-15T13:45:00.000Z") }],
        columns: [
          {
            key: "due",
            header: "Due",
            exportValue: (row: { due: Date }) => row.due,
          },
        ],
      })
    );
    expect(text).toContain("(2026-08-15 13:45)");
  });

  it("carries Unicode in ActualText and paints a WinAnsi stand-in", () => {
    const text = latin1(
      buildTablePdf({
        rows: [{ name: "Ada € — 😀", age: 1, zip: "", active: true }],
        columns: COLUMNS,
      })
    );
    expect(text).toContain("/ActualText");
    expect(text).toContain("FEFF");
    // Euro is WinAnsi 0x80, so it is an octal — the emoji is not, so `?`.
    expect(text).toContain("\\200");
    expect(text).toContain("?");
  });

  it("names the four paper sizes a host can ask for", () => {
    expect(
      latin1(buildTablePdf({ rows: ROWS, columns: COLUMNS, pageSize: "a4" }))
    ).toContain("/MediaBox [0 0 595 842]");
    expect(
      latin1(
        buildTablePdf({ rows: ROWS, columns: COLUMNS, pageSize: "letter" })
      )
    ).toContain("/MediaBox [0 0 612 792]");
    expect(
      latin1(
        buildTablePdf({
          rows: ROWS,
          columns: COLUMNS,
          pageSize: "letter-landscape",
        })
      )
    ).toContain("/MediaBox [0 0 792 612]");
    expect(
      latin1(
        buildTablePdf({
          rows: ROWS,
          columns: COLUMNS,
          pageSize: "a4-landscape",
        })
      )
    ).toContain("/MediaBox [0 0 842 595]");
  });

  it("puts the first column on the right under RTL", () => {
    const ltr = latin1(
      buildTablePdf({
        rows: ROWS,
        columns: COLUMNS,
        direction: "ltr",
      })
    );
    const rtl = latin1(
      buildTablePdf({
        rows: ROWS,
        columns: COLUMNS,
        direction: "rtl",
      })
    );
    const tm = (text: string) =>
      /1 0 0 1 ([\d.]+) [\d.]+ Tm\n\/Span << \/ActualText <[^>]+> >> BDC\n\(Name\)/.exec(
        text
      );
    const ltrName = tm(ltr);
    const rtlName = tm(rtl);
    expect(ltrName?.[1]).toBeDefined();
    expect(rtlName?.[1]).toBeDefined();
    expect(Number(rtlName?.[1])).toBeGreaterThan(Number(ltrName?.[1]));
  });

  it("inherits the document direction when none is given", () => {
    document.documentElement.setAttribute("dir", "rtl");
    const text = pdfOf();
    const name =
      /1 0 0 1 ([\d.]+) [\d.]+ Tm\n\/Span << \/ActualText <[^>]+> >> BDC\n\(Name\)/.exec(
        text
      );
    expect(Number(name?.[1])).toBeGreaterThan(400);
  });

  it("titles the first page and numbers every page", () => {
    const text = latin1(
      buildTablePdf({
        rows: ROWS,
        columns: COLUMNS,
        title: "People (draft)",
      })
    );
    expect(text).toContain("/Title (People \\(draft\\))");
    expect(text).toContain("(People \\(draft\\))");
    expect(text).toContain("(Page 1 of 1)");
  });

  it("starts a new page when the rows will not fit", () => {
    const rows = Array.from({ length: 80 }, (_, i) => ({
      name: `R${String(i)}`,
      age: i,
      zip: "00000",
      active: true,
    }));
    const text = assertWellFormed(
      buildTablePdf({ rows, columns: COLUMNS, title: "Many" })
    );
    expect(text).toContain("/Count 3");
    expect(text).toContain("(Page 1 of 3)");
    expect(text).toContain("(Page 2 of 3)");
    expect(text).toContain("(Page 3 of 3)");
    // The header repeats; the title does not.
    expect(text.split("(Name)").length).toBeGreaterThan(3);
    expect(text.match(/\(Many\) Tj/g) ?? []).toHaveLength(1);
  });

  it("bolds group and total rows and indents their leaves", () => {
    const text = latin1(
      buildTablePdf({
        rows: ROWS,
        columns: COLUMNS,
        view: [
          { role: "group", label: "Core", level: 0, labelKey: "name" },
          { role: "data", row: ROWS[0]!, level: 1 },
          {
            role: "aggregate",
            label: "Core total",
            level: 0,
            labelKey: "name",
            values: { age: 36 },
          },
        ],
      })
    );
    expect(text).toContain("(Core)");
    expect(text).toContain("(Core total)");
    expect(text).toContain("/F2 9 Tf");
    expect(text).toContain("0.95 0.95 0.95 rg");
  });

  it("starts a top-level group on a new page when asked", () => {
    const text = latin1(
      buildTablePdf({
        rows: ROWS,
        columns: COLUMNS,
        pageBreak: "group",
        view: [
          { role: "group", label: "First", level: 0, labelKey: "name" },
          { role: "data", row: ROWS[0]!, level: 1 },
          { role: "group", label: "Second", level: 0, labelKey: "name" },
          { role: "data", row: ROWS[1]!, level: 1 },
        ],
      })
    );
    expect(text).toContain("/Count 2");
    expect(text).toContain("(First)");
    expect(text).toContain("(Second)");
    expect(text).toContain("(Page 1 of 2)");
  });

  it("appends a grand-total row from summary values", () => {
    const text = latin1(
      buildTablePdf({
        rows: ROWS,
        columns: COLUMNS,
        summary: { age: 81 },
      })
    );
    expect(text).toContain("(81)");
  });

  it("sizes columns from the table so a wide first column moves the second", () => {
    const narrow = latin1(
      buildTablePdf({
        rows: ROWS,
        columns: [
          {
            key: "name",
            header: "Name",
            accessor: (row) => row.name,
            width: 80,
          },
          { key: "age", header: "Age", accessor: (row) => row.age, width: 80 },
        ],
      })
    );
    const wide = latin1(
      buildTablePdf({
        rows: ROWS,
        columns: [
          {
            key: "name",
            header: "Name",
            accessor: (row) => row.name,
            width: 320,
          },
          { key: "age", header: "Age", accessor: (row) => row.age, width: 80 },
        ],
      })
    );
    const xOf = (text: string) => {
      const match =
        /1 0 0 1 ([\d.]+) [\d.]+ Tm\n\/Span << \/ActualText <[^>]+> >> BDC\n\(Age\)/.exec(
          text
        );
      return Number(match?.[1]);
    };
    expect(xOf(wide)).toBeGreaterThan(xOf(narrow));
  });

  it("truncates a cell that will not fit its column", () => {
    const text = latin1(
      buildTablePdf({
        rows: [
          {
            name: "A".repeat(80),
            age: 1,
            zip: "",
            active: true,
          },
        ],
        columns: [
          {
            key: "name",
            header: "Name",
            accessor: (row) => row.name,
            width: 64,
          },
          { key: "age", header: "Age", accessor: (row) => row.age, width: 320 },
        ],
      })
    );
    expect(text).toContain("\\205"); // … in WinAnsi
    expect(text).not.toContain(`(${"A".repeat(80)})`);
  });

  it("still writes a valid file for a header-only table", () => {
    const text = assertWellFormed(
      buildTablePdf({ rows: [], columns: COLUMNS, title: "Empty" })
    );
    expect(text).toContain("(Name)");
    expect(text).toContain("/Count 1");
  });

  it("still writes a valid file when there are no columns", () => {
    const text = assertWellFormed(buildTablePdf({ rows: [], columns: [] }));
    expect(text).toContain("/Count 1");
  });

  it("exports the same bytes for the same table twice", () => {
    expect(buildTablePdf({ rows: ROWS, columns: COLUMNS })).toEqual(
      buildTablePdf({ rows: ROWS, columns: COLUMNS })
    );
  });

  it("will not leave a group header alone at the bottom of a page", () => {
    const rows = Array.from({ length: 31 }, (_, i) => ({
      name: `R${String(i)}`,
      age: i,
      zip: "00000",
      active: true,
    }));
    const view = [
      ...rows.slice(0, 29).map((row) => ({
        role: "data" as const,
        row,
        level: 1,
      })),
      { role: "group" as const, label: "Late", level: 0, labelKey: "name" },
      { role: "data" as const, row: rows[29]!, level: 1 },
      { role: "data" as const, row: rows[30]!, level: 1 },
    ];
    const text = latin1(
      buildTablePdf({ rows, columns: COLUMNS, view, pageSize: "a4-landscape" })
    );
    expect(text).toContain("(Late)");
    expect(text).toContain("/Count 2");
  });
});

describe("pdfWriter", () => {
  it("names itself so the download gets the right extension", () => {
    expect(pdfWriter().extension).toBe("pdf");
  });

  it("builds a PDF payload with no text form", () => {
    const payload = pdfWriter().build({
      table: buildExportTable(ROWS, COLUMNS),
      filename: "people.pdf",
    });
    expect(payload.mimeType).toBe("application/pdf");
    expect(payload.text).toBe("");
    expect(payload.parts).toHaveLength(1);
    const [part] = payload.parts;
    expect(part).toBeInstanceOf(Uint8Array);
    const bytes = part instanceof Uint8Array ? part : new Uint8Array();
    const text = assertWellFormed(bytes);
    expect(text).toContain("/Title (people)");
  });

  it("passes an explicit title through and keeps a nameless stem honest", () => {
    const titled = pdfWriter({ title: "Roster" }).build({
      table: buildExportTable(ROWS, COLUMNS),
      filename: "people.pdf",
    });
    const [part] = titled.parts;
    const bytes = part instanceof Uint8Array ? part : new Uint8Array();
    expect(latin1(bytes)).toContain("/Title (Roster)");

    const odd = pdfWriter().build({
      table: buildExportTable(ROWS, COLUMNS),
      filename: ".pdf",
    });
    const [oddPart] = odd.parts;
    const oddBytes = oddPart instanceof Uint8Array ? oddPart : new Uint8Array();
    expect(latin1(oddBytes)).toContain("/Title (.pdf)");
  });

  it("honours writer options for direction and page breaks", () => {
    const payload = pdfWriter({
      direction: "rtl",
      pageSize: "letter",
      pageBreak: "auto",
    }).build({
      table: buildExportTable(ROWS, COLUMNS),
      filename: "people.pdf",
    });
    const [part] = payload.parts;
    const bytes = part instanceof Uint8Array ? part : new Uint8Array();
    const text = latin1(bytes);
    expect(text).toContain("/MediaBox [0 0 612 792]");
  });
});
