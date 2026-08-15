import { xlsxWriter } from "@adapttable/core/xlsx";

import { MantineDemo } from "./adapters/MantineDemo";
import { Check, Layers } from "./sectionIcons";
import { SectionHead } from "./sections";

/**
 * Export the grouped sheet, as a spreadsheet.
 *
 * `scope: "all"` takes every filtered row — not just the current page of
 * five — so collapsed groups and later pages still leave the file.
 * `xlsxWriter` writes Excel outline levels for each nest and bolds the
 * group headers and totals. The live demo on the home page stays CSV;
 * only this page opts into the encoder.
 */
const EXPORT_GROUPED_AS_XLSX = {
  scope: "all",
  writer: xlsxWriter({ sheetName: "People" }),
  filename: "people.xlsx",
} as const;

export function GroupingDemo({ dark }: Readonly<{ dark: boolean }>) {
  return (
    <section className="sec shell" id="grouping">
      <SectionHead title="Group rows. Nest them. Subtotal every level.">
        Pass <code>groupBy</code> and rows fold into kit-native group headers
        with counts; pass a list — <code>{'["team", "status"]'}</code> — and
        each key nests inside the one before it. Add{" "}
        <code>groupAggregates</code> for per-group subtotals — the same mapper{" "}
        <code>summaryRow</code> uses — and every header totals its whole
        subtree. Collapse a group, edit a cell inside another, and the numbers
        keep up. Export writes the whole grouped sheet as a spreadsheet —
        outline levels for each nest, and every group total in the file. All
        opt-in: omit the props and the table stays flat.
      </SectionHead>
      <div className="pad-surface">
        <div className="hint-row">
          <span className="hint">
            <Layers size={12} /> collapse / expand any level
          </span>
          <span className="hint">
            <Check size={12} /> per-group subtotals from one mapper
          </span>
          <span className="hint">
            <Check size={12} /> a footer closes every group with its total
          </span>
          <span className="hint">
            <Check size={12} /> double-click a cell to edit it in place
          </span>
          <span className="hint">
            <Check size={12} /> Export writes the grouped sheet — outline +
            totals
          </span>
        </div>
        <div className="pad-surface__body">
          <MantineDemo
            mode="frontend"
            locale="en"
            dark={dark}
            urlKey="grp"
            grouping
            editing
            cellNavigation
            exportCsv={EXPORT_GROUPED_AS_XLSX}
          />
        </div>
      </div>
    </section>
  );
}
