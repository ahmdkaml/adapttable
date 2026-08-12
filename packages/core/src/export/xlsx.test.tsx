/**
 * The spreadsheet writer.
 *
 * Two things are being checked: that the archive contains the five documents
 * Excel requires under the exact names it looks for, and that values keep their
 * type. The second is where hand-rolled exporters usually fail — a postal code
 * arriving as a number is a data-loss bug the user cannot undo.
 */
import { describe, expect, it } from "vitest";

import type { ColumnDef } from "../types";
import { buildExportTable } from "./exportWriter";
import {
  buildTableXlsx,
  columnLetter,
  safeSheetName,
  xlsxWriter,
} from "./xlsx";

interface Row {
  name: string;
  age: number;
  zip: string;
  active: boolean;
}

const ROWS: Row[] = [
  { name: "Ada", age: 36, zip: "01730", active: true },
  { name: "Grace <&>", age: 45, zip: "02139", active: false },
];

const COLUMNS: ColumnDef<Row>[] = [
  { key: "name", header: "Name", accessor: (row) => row.name },
  { key: "age", header: "Age", accessor: (row) => row.age },
  { key: "zip", header: "Zip", accessor: (row) => row.zip },
  { key: "active", header: "Active", accessor: (row) => row.active },
];

/** Read a little-endian unsigned integer — every ZIP field is one. */
function readInt(bytes: Uint8Array, offset: number, size: number): number {
  let value = 0;
  for (let i = size - 1; i >= 0; i--) {
    value = value * 256 + bytes[offset + i]!;
  }
  return value;
}

/**
 * Unpack the archive by walking its local headers. Entries are stored, so the
 * bytes between the headers are the documents themselves.
 */
function unzip(zip: Uint8Array): Map<string, string> {
  const decoder = new TextDecoder();
  const files = new Map<string, string>();
  let at = 0;
  while (readInt(zip, at, 4) === 0x04034b50) {
    const size = readInt(zip, at + 18, 4);
    const nameLength = readInt(zip, at + 26, 2);
    const extraLength = readInt(zip, at + 28, 2);
    const name = decoder.decode(zip.slice(at + 30, at + 30 + nameLength));
    const start = at + 30 + nameLength + extraLength;
    files.set(name, decoder.decode(zip.slice(start, start + size)));
    at = start + size;
  }
  return files;
}

const sheetOf = (rows: Row[] = ROWS, columns = COLUMNS) =>
  unzip(buildTableXlsx({ rows, columns })).get("xl/worksheets/sheet1.xml") ??
  "";

describe("buildTableXlsx", () => {
  it("contains the five documents a workbook is made of", () => {
    expect([
      ...unzip(buildTableXlsx({ rows: ROWS, columns: COLUMNS })).keys(),
    ]).toEqual([
      "[Content_Types].xml",
      "_rels/.rels",
      "xl/workbook.xml",
      "xl/_rels/workbook.xml.rels",
      "xl/worksheets/sheet1.xml",
    ]);
  });

  it("declares the sheet in both the content types and the relationships", () => {
    // A part present in the archive but missing from either index is invisible
    // to Excel, which reports the whole file as corrupt rather than that part.
    const files = unzip(buildTableXlsx({ rows: ROWS, columns: COLUMNS }));
    expect(files.get("[Content_Types].xml")).toContain(
      'PartName="/xl/worksheets/sheet1.xml"'
    );
    expect(files.get("xl/_rels/workbook.xml.rels")).toContain(
      'Target="worksheets/sheet1.xml"'
    );
    expect(files.get("xl/workbook.xml")).toContain('r:id="rId1"');
  });

  it("writes a header row from the column headers", () => {
    expect(sheetOf()).toContain(
      '<row r="1"><c r="A1" t="inlineStr"><is><t xml:space="preserve">Name</t></is></c>'
    );
  });

  it("falls back to a column's key when its header is not text", () => {
    const sheet = sheetOf(ROWS, [
      { key: "name", header: <b>Name</b>, accessor: (row) => row.name },
    ]);
    expect(sheet).toContain(">name</t>");
  });

  it("keeps numbers numeric so the spreadsheet can sum them", () => {
    expect(sheetOf()).toContain('<c r="B2"><v>36</v></c>');
  });

  it("keeps text that looks numeric as text", () => {
    // "01730" is a zip code. Parsing it to 1730 is the classic export bug.
    expect(sheetOf()).toContain(
      '<c r="C2" t="inlineStr"><is><t xml:space="preserve">01730</t></is></c>'
    );
  });

  it("writes booleans as booleans", () => {
    const sheet = sheetOf();
    expect(sheet).toContain('<c r="D2" t="b"><v>1</v></c>');
    expect(sheet).toContain('<c r="D3" t="b"><v>0</v></c>');
  });

  it("escapes XML rather than producing a broken document", () => {
    expect(sheetOf()).toContain("Grace &lt;&amp;&gt;");
  });

  it("writes an empty cell as an empty cell", () => {
    const sheet = sheetOf([{ name: "", age: 1, zip: "", active: false }]);
    expect(sheet).toContain('<c r="A2"/>');
  });

  it("drops control characters that would make the file unopenable", () => {
    const sheet = sheetOf([
      { name: "a\u0001b", age: 1, zip: "", active: false },
    ]);
    expect(sheet).toContain(">ab</t>");
  });

  it("writes an empty cell for a value that is not a primitive", () => {
    // A JSX cell with an `exportValue` that returns nothing lands here; the
    // alternative is the string "[object Object]" in someone's spreadsheet.
    const sheet = sheetOf(ROWS, [
      { key: "name", header: "Name", exportValue: () => null },
    ]);
    expect(sheet).toContain('<c r="A2"/>');
  });

  it("prefers a column's exportValue, exactly as CSV does", () => {
    const sheet = sheetOf(ROWS, [
      {
        key: "name",
        header: "Name",
        accessor: (row) => row.name,
        exportValue: (row) => `${row.name} (exported)`,
      },
    ]);
    expect(sheet).toContain("Ada (exported)");
  });

  it("names the sheet, correcting what Excel would reject", () => {
    const files = unzip(
      buildTableXlsx({
        rows: ROWS,
        columns: COLUMNS,
        sheetName: "Q1/Q2 [draft]",
      })
    );
    expect(files.get("xl/workbook.xml")).toContain('name="Q1 Q2  draft"');
  });

  it("exports the same bytes for the same table twice", () => {
    expect(buildTableXlsx({ rows: ROWS, columns: COLUMNS })).toEqual(
      buildTableXlsx({ rows: ROWS, columns: COLUMNS })
    );
  });
});

describe("columnLetter", () => {
  it("counts in base-26 with no zero digit", () => {
    // The off-by-one here is why column 26 becomes "BA" in naive writers.
    expect([0, 1, 25, 26, 27, 51, 52, 701, 702].map(columnLetter)).toEqual([
      "A",
      "B",
      "Z",
      "AA",
      "AB",
      "AZ",
      "BA",
      "ZZ",
      "AAA",
    ]);
  });
});

describe("safeSheetName", () => {
  it("replaces the characters Excel forbids", () => {
    expect(safeSheetName("a:b\\c/d?e*f[g]h")).toBe("a b c d e f g h");
  });

  it("truncates to the 31 characters Excel allows", () => {
    expect(safeSheetName("x".repeat(40))).toHaveLength(31);
  });

  it("falls back rather than writing a nameless sheet", () => {
    expect(safeSheetName("  ")).toBe("Sheet1");
  });
});

describe("xlsxWriter", () => {
  it("names itself so the download gets the right extension", () => {
    expect(xlsxWriter().extension).toBe("xlsx");
  });

  it("builds a spreadsheet payload with no text form", () => {
    const payload = xlsxWriter().build({
      table: buildExportTable(ROWS, COLUMNS),
      filename: "people.xlsx",
    });
    expect(payload.mimeType).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(payload.text).toBe("");
    expect(payload.parts).toHaveLength(1);
  });

  it("passes the sheet name through to the workbook", () => {
    const payload = xlsxWriter({ sheetName: "People" }).build({
      table: buildExportTable(ROWS, COLUMNS),
      filename: "people.xlsx",
    });
    const [part] = payload.parts;
    expect(part).toBeInstanceOf(Uint8Array);
    const bytes = part instanceof Uint8Array ? part : new Uint8Array();
    expect(unzip(bytes).get("xl/workbook.xml")).toContain('name="People"');
  });
});
