/**
 * The table on an adapter's landing page.
 *
 * A first look, not a feature tour: search, filters, sorting, selection with
 * bulk actions, the column menu and export — the set someone judges a table on
 * in ten seconds. Everything that needs a paragraph of explanation has its own
 * page, one click away in the grid below this.
 */
import { Suspense } from "react";

import { ADAPTERS, DemoFallback } from "../kitDemos";
import { DemoScenarioProvider } from "../Demo";
import type { FeatureBodyProps } from "./featureBodies";

export function LandingTable({ dark, adapter }: Readonly<FeatureBodyProps>) {
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  return (
    <div className="mx-demo">
      <div className="mx-demo__body" data-adapter={adapter}>
        <Suspense fallback={<DemoFallback />}>
          <DemoScenarioProvider value="landing">
            <Demo
              mode="frontend"
              locale="en"
              dark={dark}
              urlKey="t"
              filterControls
              columnMenu
              bulkActions
              exportCsv
            />
          </DemoScenarioProvider>
        </Suspense>
      </div>
    </div>
  );
}
