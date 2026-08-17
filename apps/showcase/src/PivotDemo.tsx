import { usePivotUrlState } from "@adapttable/core/pivot";
import { getLabels } from "@adapttable/i18n";
import { Suspense, useState } from "react";

import { cssVars } from "./cssVars";
import { PIVOT_FIELDS, PIVOT_PEOPLE } from "./data";
import { KitSwitcher, readKitFromUrl } from "./kitDemos";
import { kitPivotPanel, KitProvider } from "./kitProviders";
import { PivotTableView } from "./PivotTableView";
import { SectionHead } from "./sections";
import { ADAPTER_TOKENS } from "./themeTokens";

/** Where the demo starts: something already pivoted, so the page shows a pivot. */
const START = {
  rows: ["team"],
  columns: ["status"],
  measures: [{ key: "budget", agg: "sum" as const }],
};

/**
 * The pivot page: one dataset, the configuration panel, and the table it
 * produces — in whichever kit the reader picks. Nothing else — the point of the
 * page is the shape of a pivot, not the rest of the table's features.
 */
export function PivotDemo({ dark }: Readonly<{ dark: boolean }>) {
  const [adapter, setAdapter] = useState(readKitFromUrl);
  const token =
    ADAPTER_TOKENS.find((candidate) => candidate.key === adapter) ??
    ADAPTER_TOKENS[0];
  const { config, onConfigChange, collapsed, onCollapsedChange } =
    usePivotUrlState({
      urlKey: "p",
      defaultConfig: START,
    });
  const onToggleFold = (key: string) => {
    const next = new Set(collapsed);
    if (!next.delete(key)) next.add(key);
    onCollapsedChange(next);
  };
  const PivotPanel = kitPivotPanel(adapter);

  return (
    <section className="sec shell" id="pivot">
      <SectionHead title="Rows down the side. Dimensions across the top.">
        Grouping answers &ldquo;what is the total per team&rdquo;. A pivot
        answers &ldquo;what is the total per team <em>per status</em>&rdquo; —
        and that second dimension becomes columns the data never had. Move
        fields between the three zones with the buttons, and fold a subtotal
        group away by its own line. All of it lives in the URL — the axes, the
        measures and what you folded — so the pivot you build is the pivot you
        can send someone. The table is the kit&rsquo;s own: same result, same
        header tree, rendered by whichever adapter you pick.
      </SectionHead>
      <KitSwitcher adapter={adapter} dark={dark} onChange={setAdapter} />
      <div className="pad-surface">
        <KitProvider kit={adapter} dark={dark}>
          <div
            className="pivot-layout"
            data-adapter={adapter}
            key={adapter}
            style={cssVars({
              "--c": dark ? token.accentDark : token.accentLight,
            })}
          >
            <Suspense fallback={null}>
              <PivotPanel
                fields={PIVOT_FIELDS}
                config={config}
                onChange={onConfigChange}
                labels={getLabels("en")}
              />
            </Suspense>
            <PivotTableView
              kit={adapter}
              rows={PIVOT_PEOPLE}
              fields={PIVOT_FIELDS}
              config={config}
              collapsed={collapsed}
              onToggleFold={onToggleFold}
            />
          </div>
        </KitProvider>
      </div>
    </section>
  );
}
