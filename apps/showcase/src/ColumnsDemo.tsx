import { xlsxWriter } from "@adapttable/core/xlsx";

import { AntdDemo } from "./adapters/AntdDemo";
import { Columns, Keyboard, Pin, Resize } from "./sectionIcons";
import { SectionHead } from "./sections";

/**
 * Export what you highlighted, as a spreadsheet.
 *
 * `scope: "range"` takes the rectangle cell navigation is holding, and
 * `xlsxWriter` writes it as a real `.xlsx` — a separate entry point, so a table
 * that exports CSV never ships the encoder. With nothing highlighted the
 * button falls back to the current page, which is why it is never a dead end.
 */
const EXPORT_RANGE_AS_XLSX = {
  scope: "range",
  writer: xlsxWriter({ sheetName: "People" }),
  filename: "people.xlsx",
} as const;

export function ColumnsDemo({ dark }: Readonly<{ dark: boolean }>) {
  return (
    <section className="sec shell" id="columns">
      <SectionHead title="Wide tables, fully handled.">
        Show/hide, drag-reorder, pin to the start, and resize by drag or
        keyboard — open the Columns menu, grab a header edge, or tap the pin to
        stick a column to the start, then tap again to unpin. Persist the layout
        to localStorage, the URL, or your server. <code>cellNavigation</code> is
        on here too: Tab reaches the table once, then the arrow keys walk the
        cells and a screen reader names each one. Hold Shift while arrowing to
        highlight a block, and Export writes exactly that block as a
        spreadsheet.
      </SectionHead>
      <div className="pad-surface">
        <div className="hint-row">
          <span className="hint">
            <Pin size={12} /> Pin a column to the start
          </span>
          <span className="hint">
            <Resize size={12} /> drag a column edge to resize
          </span>
          <span className="hint">
            <Columns size={12} /> Columns menu reorders &amp; hides
          </span>
          <span className="hint">
            <Keyboard size={12} /> Tab in, arrow between cells, Shift+arrow to
            select, then Export
          </span>
        </div>
        <div className="pad-surface__body">
          <AntdDemo
            mode="frontend"
            locale="en"
            dark={dark}
            urlKey="cols"
            wide
            cellNavigation
            exportCsv={EXPORT_RANGE_AS_XLSX}
            exportLabel="Export XLSX"
          />
        </div>
      </div>
    </section>
  );
}
