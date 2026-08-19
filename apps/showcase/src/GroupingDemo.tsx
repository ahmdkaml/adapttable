import { xlsxWriter } from "@adapttable/core/xlsx";
import { Suspense } from "react";

import { ADAPTERS, DemoFallback } from "./kitDemos";
import { DemoScenarioProvider } from "./Demo";
import type { FeatureBodyProps } from "./matrix/featureBodies";
import { Check, Layers } from "./sectionIcons";

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

export function GroupingDemo({ dark, adapter }: Readonly<FeatureBodyProps>) {
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  return (
    <div className="mx-demo">
      <div className="hint-row">
        <span className="hint">
          <Layers size={12} /> Platform is the large squad — collapse any level
        </span>
        <span className="hint">
          <Check size={12} /> per-group subtotals from one mapper
        </span>
        <span className="hint">
          <Check size={12} /> a footer closes every group with its total
        </span>
        <span className="hint">
          <Check size={12} /> Export writes the grouped sheet — outline + totals
        </span>
      </div>
      <div className="mx-demo__body">
        <div key={adapter} data-adapter={adapter}>
          <Suspense fallback={<DemoFallback />}>
            <DemoScenarioProvider value="grouping">
              <Demo
                mode="frontend"
                locale="en"
                dark={dark}
                urlKey="grp"
                grouping
                exportCsv={EXPORT_GROUPED_AS_XLSX}
                focused
              />
            </DemoScenarioProvider>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
