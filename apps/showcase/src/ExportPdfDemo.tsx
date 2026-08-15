import {
  buildGroupedFlatModel,
  type ColumnDef,
  viewFromGroupedEntries,
} from "@adapttable/core";
import { pdfWriter, printTable } from "@adapttable/core/pdf";

import { MantineDemo } from "./adapters/MantineDemo";
import { budget, PEOPLE, type Person, personStatus } from "./data";
import { Check, Layers } from "./sectionIcons";
import { SectionHead } from "./sections";

/**
 * Export the grouped sheet, as a PDF.
 *
 * `scope: "all"` takes every filtered row — not just the current page of
 * five — so collapsed groups and later pages still leave the file.
 * `pdfWriter` paginates on group boundaries and honours column widths.
 * The live demo on the home page stays CSV; only this page opts into the
 * encoder.
 */
const EXPORT_GROUPED_AS_PDF = {
  scope: "all",
  writer: pdfWriter({
    title: "People",
    pageSize: "a4-landscape",
    pageBreak: "group",
  }),
  filename: "people.pdf",
} as const;

/**
 * Print columns are primitives with stated widths so the host-owned Print
 * control shows the same groups and proportions the PDF paginates — not
 * the JSX cells the on-screen table paints.
 */
const PRINT_COLUMNS: ColumnDef<Person>[] = [
  { key: "person", header: "Person", accessor: (row) => row.name, width: 200 },
  { key: "team", header: "Team", accessor: (row) => row.team, width: 110 },
  {
    key: "status",
    header: "Status",
    accessor: (row) => personStatus(row),
    width: 100,
  },
  { key: "role", header: "Role", accessor: (row) => row.role, width: 160 },
  {
    key: "budget",
    header: "Budget",
    accessor: (row) => budget(row),
    exportValue: (row) => budget(row),
    width: 110,
  },
];

/** Open the browser print dialog on the grouped view. Core has no Print button. */
function printPeople(): void {
  printTable({
    rows: PEOPLE,
    columns: PRINT_COLUMNS,
    view: viewFromGroupedEntries(
      buildGroupedFlatModel({
        rows: PEOPLE,
        columns: PRINT_COLUMNS,
        groupBy: ["team", "status"],
        getRowId: (row) => row.id,
        collapsedGroupIds: new Set<string>(),
        footers: false,
      }),
      undefined,
      true
    ),
    title: "People",
    pageSize: "a4-landscape",
    pageBreak: "group",
  });
}

export function ExportPdfDemo({ dark }: Readonly<{ dark: boolean }>) {
  return (
    <section className="sec shell" id="export-pdf">
      <SectionHead title="Download a PDF. Print a grouped view.">
        Pass <code>pdfWriter</code> on <code>exportCsv</code> and the toolbar
        says <strong>Export PDF</strong> — the same seam as CSV and XLSX,{" "}
        <code>{'scope: "all"'}</code> so every grouped row leaves the file.
        Print is a different verb: a host-owned control calls{" "}
        <code>printTable</code> (which loads <code>openPrintLayout</code>) so
        the browser dialog sees column widths, nested groups and page breaks.
        This button builds its sample from the same rows and columns; in an app,
        pass the table&apos;s current view when print must follow live collapse
        or filter state. There is no core Print button. Scripts the hand-written
        PDF cannot draw belong on that print path.
      </SectionHead>
      <div className="pad-surface">
        <div
          className="hint-row"
          style={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span className="hint">
              <Layers size={12} /> grouped by team, then status
            </span>
            <span className="hint">
              <Check size={12} /> Export PDF writes the whole grouped sheet
            </span>
            <span className="hint">
              <Check size={12} /> Print is host-owned — same view, browser
              dialog
            </span>
          </div>
          <button type="button" className="nav__cta" onClick={printPeople}>
            Print
          </button>
        </div>
        <div className="pad-surface__body">
          <MantineDemo
            mode="frontend"
            locale="en"
            dark={dark}
            urlKey="pdf"
            grouping
            exportCsv={EXPORT_GROUPED_AS_PDF}
            focused
          />
        </div>
      </div>
    </section>
  );
}
