import { Suspense } from "react";

import { ADAPTERS, DemoFallback } from "./kitDemos";
import type { FeatureBodyProps } from "./matrix/featureBodies";
import { Bolt, Check } from "./sectionIcons";

/**
 * The realtime page: rows changing under the reader while they work.
 *
 * The updates arrive through the patch API rather than by replacing the array,
 * which is what keeps the patch log the incremental engine reads — only the
 * touched rows re-run search, filters and sort. The feed beside the table
 * lists what was applied, so the changes can be followed rather than spotted.
 */
export function RealtimeDemo({ dark, adapter }: Readonly<FeatureBodyProps>) {
  const Demo = ADAPTERS[adapter] ?? ADAPTERS.mantine;
  return (
    <div className="mx-demo">
      <div className="hint-row">
        <span className="hint">
          <Bolt size={12} /> budgets update on a timer, one row at a time
        </span>
        <span className="hint">
          <Check size={12} /> sort by Budget and watch rows re-order live
        </span>
        <span className="hint">
          <Check size={12} /> the feed lists every patch as it lands
        </span>
      </div>
      <div className="mx-demo__body">
        <div key={adapter} data-adapter={adapter}>
          <Suspense fallback={<DemoFallback />}>
            <Demo
              mode="frontend"
              locale="en"
              dark={dark}
              urlKey="rt"
              realtime
              focused
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
