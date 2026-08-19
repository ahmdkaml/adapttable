import type { ColumnLayoutState } from "@adapttable/core";
import { Suspense } from "react";

import { DemoScenarioProvider } from "./Demo";
import { ADAPTERS, DemoFallback } from "./kitDemos";
import type { FeatureBodyProps } from "./matrix/featureBodies";

const RTL_DEFAULT_LAYOUT = {
  hidden: ["email", "team"],
  pinned: { person: "start" },
} as const satisfies Partial<ColumnLayoutState>;

export function RtlSection({ dark, adapter }: Readonly<FeatureBodyProps>) {
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  return (
    <div className="mx-demo">
      <div className="mx-demo__body">
        <div key={adapter} data-adapter={adapter}>
          <Suspense fallback={<DemoFallback />}>
            <DemoScenarioProvider value="rtl">
              <Demo
                mode="frontend"
                locale="ar"
                dark={dark}
                urlKey="rtl"
                defaultColumnLayout={RTL_DEFAULT_LAYOUT}
                // The filters popover is the point of this page: it has to anchor
                // and flip from the correct edge under RTL, which nothing can show
                // if `focused` strips the control that opens it.
                filterControls
                focused
              />
            </DemoScenarioProvider>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
