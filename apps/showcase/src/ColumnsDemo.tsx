import { xlsxWriter } from "@adapttable/core/xlsx";

import { AntdDemo } from "./adapters/AntdDemo";
import { Columns, Keyboard, Pin, Resize } from "./sectionIcons";
import { SectionHead } from "./sections";

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
        to localStorage, the URL, or your server. Arrow through cells, hold
        Shift to select a range, and export exactly that range. No row grouping,
        editing, or spanning header groups compete with the column layout.
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
            <Keyboard size={12} /> Shift+arrow selects a range to export
          </span>
        </div>
        <div className="pad-surface__body">
          <AntdDemo
            mode="frontend"
            locale="en"
            dark={dark}
            urlKey="cols"
            wide
            // This page IS the column tools, so it says so rather than
            // inheriting the menu from whether the column set happens to be
            // wide — a coupling that left every kit but antd without one.
            columnMenu
            cellNavigation
            exportCsv={EXPORT_RANGE_AS_XLSX}
            focused
          />
        </div>
      </div>
    </section>
  );
}
